import type { Metadata } from "next";
import { Fraunces, Sora } from "next/font/google";
import { ChromeShell } from "@/components/ChromeShell";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Groundwater — hidden ties inside your company",
  description:
    "Surface colleague ties you do not already know: shared pasts, public interactions, and the people who sit between coworkers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" className={`${fraunces.variable} ${sora.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <ChromeShell>{children}</ChromeShell>
      </body>
    </html>
  );
}
