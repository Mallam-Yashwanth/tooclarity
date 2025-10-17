import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../lib/auth-context";
import ToastProvider from "@/components/ui/ToastProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import NotificationSocketBridge from "@/components/providers/NotificationSocketBridge";
import ThemeProvider from "@/components/providers/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const Montserrat = Geist_Mono({
  variable: "--font-Montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TooClarity",
  description: "A platform connecting students with educational institutions.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${Montserrat.variable} antialiased`}
      >
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              {children}
              <ToastProvider /> {/* 👈 This must exist ONCE globally */}
              <NotificationSocketBridge />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
