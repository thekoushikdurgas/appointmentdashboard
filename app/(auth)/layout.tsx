import "@/styles/auth/auth-shell.css";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="c360-auth-layout">{children}</div>;
}
