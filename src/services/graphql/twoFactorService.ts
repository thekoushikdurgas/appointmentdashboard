import { graphqlQuery, graphqlMutation } from "@/lib/graphqlClient";
import type {
  RegenerateBackupCodesResponse,
  TwoFactorSetupResponse,
  TwoFactorStatus,
  Verify2FaResponse,
} from "@/graphql/generated/types";

export type { TwoFactorStatus, TwoFactorSetupResponse };

const GET_2FA_STATUS = `query TwoFactorStatus {
  twoFactor {
    get2FAStatus {
      enabled
      verified
    }
  }
}`;

const SETUP_2FA = `mutation Setup2FA {
  twoFactor {
    setup2FA {
      secret
      qrCodeUrl
      qrCodeData
      backupCodes
    }
  }
}`;

const VERIFY_2FA = `mutation VerifyTwoFactor($code: String!) {
  twoFactor {
    verify2FA(code: $code) {
      verified
      backupCodes
    }
  }
}`;

const DISABLE_2FA = `mutation DisableTwoFactor($password: String, $backupCode: String) {
  twoFactor {
    disable2FA(password: $password, backupCode: $backupCode)
  }
}`;

const REGENERATE_BACKUP_CODES = `mutation RegenerateBackupCodes {
  twoFactor {
    regenerateBackupCodes {
      backupCodes
    }
  }
}`;

export const twoFactorService = {
  getStatus: () =>
    graphqlQuery<{ twoFactor: { get2FAStatus: TwoFactorStatus } }>(
      GET_2FA_STATUS,
    ),

  setup: () =>
    graphqlMutation<{ twoFactor: { setup2FA: TwoFactorSetupResponse } }>(
      SETUP_2FA,
      {},
    ),

  verify: (code: string) =>
    graphqlMutation<{ twoFactor: { verify2FA: Verify2FaResponse } }>(
      VERIFY_2FA,
      { code },
    ),

  disable: (password?: string | null, backupCode?: string | null) =>
    graphqlMutation<{ twoFactor: { disable2FA: boolean } }>(DISABLE_2FA, {
      password: password ?? null,
      backupCode: backupCode ?? null,
    }),

  regenerateBackupCodes: () =>
    graphqlMutation<{
      twoFactor: { regenerateBackupCodes: RegenerateBackupCodesResponse };
    }>(REGENERATE_BACKUP_CODES, {}),
};
