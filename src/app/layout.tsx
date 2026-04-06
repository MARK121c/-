import type { Metadata } from "next";
import { Outfit, Cairo } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "Personal OS | Control Center",
  description: "Ultra-Premium Personal Operating System & Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${outfit.variable} ${cairo.variable} h-full antialiased dark`}>
      <body className="min-h-full bg-super-dark font-sans selection:bg-emerald-500/30 text-white">
        {children}
      </body>
    </html>
  );
}
