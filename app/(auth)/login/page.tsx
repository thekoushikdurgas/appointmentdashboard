"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useLoginForm } from "@/hooks/useLoginForm";
import { useOtpLoginForm } from "@/hooks/useOtpLoginForm";
import { useRegisterForm } from "@/hooks/useRegisterForm";
import { AuthBrandHeader } from "@/components/feature/auth/AuthBrandHeader";
import {
  AuthTabList,
  type AuthTab,
} from "@/components/feature/auth/AuthTabList";
import { AuthLoginForm } from "@/components/feature/auth/AuthLoginForm";
import { AuthOtpLoginForm } from "@/components/feature/auth/AuthOtpLoginForm";
import { AuthRegisterForm } from "@/components/feature/auth/AuthRegisterForm";
import { AuthLoginFallback } from "@/components/feature/auth/AuthLoginFallback";
import { EmailOtpModal } from "@/components/feature/auth/EmailOtpModal";

type LoginMethod = "password" | "otp";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<AuthTab>(
    rawTab === "register" ? "register" : "login",
  );
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("password");

  useEffect(() => {
    setActiveTab(searchParams.get("tab") === "register" ? "register" : "login");
  }, [searchParams]);

  const switchTab = (tab: AuthTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams();
    if (tab === "register") params.set("tab", "register");
    router.replace(`/login${params.size ? `?${params}` : ""}`);
  };

  useAuthRedirect();

  const {
    login,
    register,
    requestLoginOtp,
    emailVerificationChallenge,
    loginOtpChallenge,
    verifyEmailOtp,
    resendEmailOtp,
    dismissEmailOtp,
    otpModalError,
    otpModalLoading,
  } = useAuth();

  const loginForm = useLoginForm({ login });
  const otpLoginForm = useOtpLoginForm({ requestLoginOtp });
  const registerForm = useRegisterForm({ register });

  const otpChallenge = emailVerificationChallenge ?? loginOtpChallenge;
  const otpPurpose = emailVerificationChallenge ? "registration" : "login";

  const subtitle = useMemo(
    () =>
      activeTab === "login"
        ? "Sign in to your account"
        : "Create a new account",
    [activeTab],
  );

  return (
    <>
      <div className="c360-auth-card" suppressHydrationWarning>
        <AuthBrandHeader subtitle={subtitle} />
        <AuthTabList active={activeTab} onChange={switchTab} />

        {activeTab === "login" && (
          <>
            <div className="c360-auth-method-toggle">
              <button
                type="button"
                className={`c360-auth-method-toggle__btn${loginMethod === "password" ? " c360-auth-method-toggle__btn--active" : ""}`}
                onClick={() => setLoginMethod("password")}
              >
                Password
              </button>
              <button
                type="button"
                className={`c360-auth-method-toggle__btn${loginMethod === "otp" ? " c360-auth-method-toggle__btn--active" : ""}`}
                onClick={() => setLoginMethod("otp")}
              >
                Email code
              </button>
            </div>

            {loginMethod === "password" ? (
              <AuthLoginForm
                form={loginForm}
                onSwitchToRegister={() => switchTab("register")}
              />
            ) : (
              <AuthOtpLoginForm
                form={otpLoginForm}
                onSwitchToPassword={() => setLoginMethod("password")}
              />
            )}
          </>
        )}
        {activeTab === "register" && (
          <AuthRegisterForm
            form={registerForm}
            onSwitchToLogin={() => switchTab("login")}
          />
        )}
      </div>

      {otpChallenge && (
        <EmailOtpModal
          isOpen
          email={otpChallenge.email}
          purpose={otpPurpose}
          loading={otpModalLoading}
          error={otpModalError}
          onVerify={verifyEmailOtp}
          onResend={resendEmailOtp}
          onClose={dismissEmailOtp}
        />
      )}
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthLoginFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
