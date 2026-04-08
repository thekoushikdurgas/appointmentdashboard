import type { Metadata } from "next";
import { Poppins, Nunito } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { RoleProvider } from "@/context/RoleContext";
import ConditionalLayout from "./ConditionalLayout";
import { cn } from "@/lib/utils";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contact360 — App",
  description: "Contact360 user dashboard for app.contact360.io",
  icons: { icon: "/favicon.svg" },
};

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head />
      <body
        className={cn(poppins.variable, nunito.variable)}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            <RoleProvider>
              <ConditionalLayout>{children}</ConditionalLayout>
            </RoleProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
