"use client";

import { Suspense, useState, useEffect, useMemo, useCallback } from "react";
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
import {
  AuthLoginForm,
  type LoginMethod,
} from "@/components/feature/auth/AuthLoginForm";
import { AuthRegisterForm } from "@/components/feature/auth/AuthRegisterForm";
import { AuthLoginFallback } from "@/components/feature/auth/AuthLoginFallback";
import { EmailOtpModal } from "@/components/feature/auth/EmailOtpModal";

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

  const switchToOtp = useCallback(() => {
    otpLoginForm.setEmail(loginForm.email);
    setLoginMethod("otp");
  }, [loginForm.email, otpLoginForm]);

  const switchToPassword = useCallback(() => {
    loginForm.setEmail(otpLoginForm.email);
    setLoginMethod("password");
  }, [otpLoginForm.email, loginForm]);

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
          <AuthLoginForm
            form={loginForm}
            otpForm={otpLoginForm}
            loginMethod={loginMethod}
            onSwitchToOtp={switchToOtp}
            onSwitchToPassword={switchToPassword}
            onSwitchToRegister={() => switchTab("register")}
            loginOtpActive={!!loginOtpChallenge}
            loginOtpEmail={loginOtpChallenge?.email}
            otpLoading={otpModalLoading}
            otpError={otpModalError}
            onVerifyOtp={verifyEmailOtp}
            onResendOtp={resendEmailOtp}
          />
        )}
        {activeTab === "register" && (
          <AuthRegisterForm
            form={registerForm}
            onSwitchToLogin={() => switchTab("login")}
          />
        )}
      </div>

      {emailVerificationChallenge && (
        <EmailOtpModal
          isOpen
          email={emailVerificationChallenge.email}
          purpose="registration"
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
