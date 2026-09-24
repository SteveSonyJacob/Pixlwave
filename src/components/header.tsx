import Link from "next/link";
import { Brand } from "@/components/brand";
import { getCurrentIdentity } from "@/lib/auth/identity";

export async function Header() {
  let identity = null;
  try {
    identity = await getCurrentIdentity();
  } catch {
    // Public shell stays available while a developer is completing provider configuration.
  }
  return (
    <header className="site-header">
      <div className="nav-wrap">
        <Brand />
        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link href="/">Home</Link>
          <Link href="/discover">Discover media</Link>
          <Link href="/map">Explore map</Link>
          <Link href="/#process">How it works</Link>
          {identity ? <Link href="/support">Support</Link> : <Link href="/#policy">Booking policy</Link>}
          {identity?.advertiserEnabled ? <Link href="/cart">Cart</Link> : null}
        </nav>
        <details className="mobile-navigation">
          <summary aria-label="Open navigation menu">Menu</summary>
          <nav aria-label="Mobile navigation">
            <Link href="/">Home</Link>
            <Link href="/discover">Discover media</Link>
            <Link href="/map">Explore map</Link>
            <Link href="/#process">How it works</Link>
            {identity ? <Link href="/support">Support</Link> : <Link href="/#policy">Booking policy</Link>}
            {identity?.advertiserEnabled ? <Link href="/cart">Cart</Link> : null}
            {identity ? <Link href="/account">My account</Link> : <Link href="/auth/sign-in">Sign in</Link>}
            {!identity ? <Link href="/auth/sign-up">Create account</Link> : null}
          </nav>
        </details>
        <div className="nav-actions">
          {identity ? (
            <Link className="button button-small" href="/account">My account</Link>
          ) : (
            <>
              <Link className="text-link" href="/auth/sign-in">Sign in</Link>
              <Link className="button button-small" href="/auth/sign-up">Create account</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
