"use client";
import { useState, useEffect, useCallback } from "react";
import {
  twoFactorService,
  type TwoFactorStatus,
  type TwoFactorSetupResponse,
} from "@/services/graphql/twoFactorService";
import {
  TOTP_CODE_LENGTH,
  isValidTotpCode,
  normalizeTotpCode,
} from "@/lib/twoFactorUtils";

export type TwoFactorSetupData = TwoFactorSetupResponse;

export function useTwoFactor() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await twoFactorService.getStatus();
      setStatus(res.twoFactor.get2FAStatus);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load 2FA status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  const setup = useCallback(async () => {
    setWorking(true);
    setError(null);
    try {
      const res = await twoFactorService.setup();
      setSetupData(res.twoFactor.setup2FA);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to setup 2FA");
    } finally {
      setWorking(false);
    }
  }, []);

  /**
   * Verify TOTP from the authenticator app. API currently expects exactly 6 digits;
   * backup codes cannot be used here until the gateway supports them in `verify2FA`.
   */
  const verify = useCallback(
    async (code: string): Promise<boolean> => {
      const normalized = normalizeTotpCode(code);
      if (!isValidTotpCode(normalized)) {
        setError(
          `Enter exactly ${TOTP_CODE_LENGTH} digits from your authenticator app.`,
        );
        return false;
      }
      setWorking(true);
      setError(null);
      try {
        const res = await twoFactorService.verify(normalized);
        const verified = res.twoFactor.verify2FA.verified;
        if (verified) {
          setStatus({ enabled: true, verified: true });
          setSetupData(null);
          await fetchStatus();
        }
        return verified;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Verification failed");
        return false;
      } finally {
        setWorking(false);
      }
    },
    [fetchStatus],
  );

  const disable = useCallback(
    async (password?: string, backupCode?: string): Promise<boolean> => {
      setWorking(true);
      setError(null);
      try {
        await twoFactorService.disable(password, backupCode);
        setStatus({ enabled: false, verified: false });
        setSetupData(null);
        await fetchStatus();
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to disable 2FA");
        return false;
      } finally {
        setWorking(false);
      }
    },
    [fetchStatus],
  );

  const regenerateBackupCodes = useCallback(async (): Promise<string[]> => {
    setWorking(true);
    setError(null);
    try {
      const res = await twoFactorService.regenerateBackupCodes();
      const codes = res.twoFactor.regenerateBackupCodes.backupCodes;
      await fetchStatus();
      return codes;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to regenerate codes");
      return [];
    } finally {
      setWorking(false);
    }
  }, [fetchStatus]);

  return {
    status,
    setupData,
    loading,
    working,
    error,
    setup,
    verify,
    disable,
    regenerateBackupCodes,
    refresh: fetchStatus,
  };
}
