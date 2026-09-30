import Link from "next/link";
import { Brand } from "@/components/brand";
import { getCurrentIdentity } from "@/lib/auth/identity";
import { MobileNavigation } from "@/components/mobile-navigation";
import { NavigationLink } from "@/components/navigation-link";
import { LinkButton } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginLink } from "@/components/auth-entry-menu";

function PrimaryLinks({ signedIn }: { signedIn: boolean }) {
  return <>
    <NavigationLink href="/">Home</NavigationLink>
    <NavigationLink href="/discover">Browse screens</NavigationLink>
    <NavigationLink href="/map">Explore map</NavigationLink>
    {signedIn ? <NavigationLink href="/support">Support</NavigationLink> : <NavigationLink href="/#policy">Booking policy</NavigationLink>}
  </>;
}

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
          <PrimaryLinks signedIn={Boolean(identity)} />
        </nav>
        <MobileNavigation>
            <PrimaryLinks signedIn={Boolean(identity)} />
            {identity ? <Link href="/account">My account</Link> : <LoginLink />}
        </MobileNavigation>
        <div className="nav-actions">
          {identity ? (
            <LinkButton className="nav-account-action" size="sm" href="/account">My account</LinkButton>
          ) : (
            <LoginLink />
          )}
        </div>
      </div>
      <ThemeToggle />
    </header>
  );
}
