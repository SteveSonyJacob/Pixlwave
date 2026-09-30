import type { Metadata } from "next";
import { Header } from "@/components/header";
import { SiteFooter } from "@/components/site-footer";
import "@fontsource-variable/inter";
import "maplibre-gl/dist/maplibre-gl.css";
import "./design-system.css";
import "./globals.css";
import "./theme.css";

const themeBootScript = `try{var saved=localStorage.getItem("pixlwave-theme");var dark=saved==="dark"||(saved!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=dark?"dark":"light"}catch{document.documentElement.dataset.theme=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}`;

export const metadata: Metadata = {
  title: { default: "Pixlwave — Advertising across Kerala", template: "%s · Pixlwave" },
  description: "Plan LED, theatre and mobile media campaigns across Kerala with transparent pricing and admin-coordinated confirmation."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeBootScript }} /></head>
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <Header />
        <div id="main-content" className="content-start" tabIndex={-1}>{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
