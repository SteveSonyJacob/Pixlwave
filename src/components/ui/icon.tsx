import type { SVGProps } from "react";

const paths = {
  arrow: "M5 12h14m-6-6 6 6-6 6",
  location: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  screen: "M3 4h18v13H3zM8 21h8m-4-4v4",
  search: "m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  menu: "M4 6h16M4 12h16M4 18h16",
  info: "M12 11v6m0-10v.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  check: "m7 12 3 3 7-7M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  warning: "m12 3 10 18H2L12 3Zm0 6v5m0 3v.01",
  moon: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z",
  sun: "M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
} as const;

export function Icon({ name, size = 20, ...props }: SVGProps<SVGSVGElement> & { name: keyof typeof paths; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}><path d={paths[name]} /></svg>;
}
