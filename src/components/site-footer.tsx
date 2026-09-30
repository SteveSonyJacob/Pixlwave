import Link from "next/link";
import { Brand } from "./brand";
import { FooterVisibility } from "./footer-visibility";

export function SiteFooter() {
  return <FooterVisibility><footer className="site-footer"><div className="site-footer-grid"><div><Brand /><p>LED screens, theatre media and mobile advertising across Kerala.</p></div><nav aria-label="Marketplace"><b>Marketplace</b><Link href="/discover">Browse screens</Link><Link href="/map">Explore map</Link></nav><nav aria-label="Account and support"><b>Account</b><Link href="/auth/sign-up">Create account</Link><Link href="/auth/sign-in">Sign in</Link><Link href="/support">Support</Link></nav><div><b>Service region</b><p>Kerala · INR · IST</p><p>Map data © OpenStreetMap contributors.</p></div></div><div className="site-footer-bottom"><span>© 2026 Pixlwave</span><span>Payment is verified before admin-coordinated confirmation.</span></div></footer></FooterVisibility>;
}
