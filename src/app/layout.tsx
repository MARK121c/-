import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
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
    <html lang="ar" dir="rtl" className={`${outfit.variable} h-full antialiased dark`}>
      <body className="min-h-full bg-black font-sans selection:bg-primary/30">
        {children}
      </body>
    </html>
  );
}
