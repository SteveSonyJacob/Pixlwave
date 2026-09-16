import type { Metadata } from "next";
import { Header } from "@/components/header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Pixlwave — Advertising across Kerala", template: "%s · Pixlwave" },
  description: "Plan LED, theatre and mobile media campaigns across Kerala with transparent pricing and admin-coordinated confirmation."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
