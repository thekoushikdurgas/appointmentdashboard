"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useLoginForm } from "@/hooks/useLoginForm";
import { useRegisterForm } from "@/hooks/useRegisterForm";
import { AuthBrandHeader } from "@/components/feature/auth/AuthBrandHeader";
import {
  AuthTabList,
  type AuthTab,
} from "@/components/feature/auth/AuthTabList";
import { AuthLoginForm } from "@/components/feature/auth/AuthLoginForm";
import { AuthRegisterForm } from "@/components/feature/auth/AuthRegisterForm";
import { AuthLoginFallback } from "@/components/feature/auth/AuthLoginFallback";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<AuthTab>(
    rawTab === "register" ? "register" : "login",
  );

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

  const { login, register } = useAuth();

  const loginForm = useLoginForm({ login });
  const registerForm = useRegisterForm({ register });

  const subtitle = useMemo(
    () =>
      activeTab === "login"
        ? "Sign in to your account"
        : "Create a new account",
    [activeTab],
  );

  return (
    <div className="c360-auth-card">
      <AuthBrandHeader subtitle={subtitle} />
      <AuthTabList active={activeTab} onChange={switchTab} />

      {activeTab === "login" && (
        <AuthLoginForm
          form={loginForm}
          onSwitchToRegister={() => switchTab("register")}
        />
      )}
      {activeTab === "register" && (
        <AuthRegisterForm
          form={registerForm}
          onSwitchToLogin={() => switchTab("login")}
        />
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthLoginFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
