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
          <Link href="/map">Explore map</Link>
          <Link href="/#categories">Media types</Link>
          <Link href="/#process">How it works</Link>
          <Link href="/#policy">Booking policy</Link>
        </nav>
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
