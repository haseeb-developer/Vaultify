import { Link, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser } from '@clerk/clerk-react';
import { Sparkles } from 'lucide-react';
import "./Header.css"
// import { useTheme } from '../contexts/ThemeProvider';

export default function Header() {
  const { isSignedIn, user } = useUser();
  const location = useLocation();
  // const { theme, toggleTheme } = useTheme();

  return (
    <header className="header">
      {/* Left: Logo */}
      <div className="header-logo">
        <Link to="/" className="header-logo-link">
          <span className="header-logo-icon"><Sparkles size={32} /></span>
          <span className="header-logo-text">Vaultify</span>
        </Link>
      </div>
      <div className="header-center">
        {/* Center: Nav Links */}
        <nav className="header-nav">
          <SignedIn>
            <Link to="/dashboard" className={`header-link${location.pathname.startsWith('/dashboard') ? ' active' : ''}`}>
              <span className="header-link-text">Dashboard</span>
              <span className="header-link-underline"></span>
            </Link>
            <Link to="/profile" className={`header-link${location.pathname.startsWith('/profile') ? ' active' : ''}`}>
              <span className="header-link-text">Profile</span>
              <span className="header-link-underline"></span>
            </Link>
          </SignedIn>
        </nav>
        {/* Right: Auth/User */}
        <div className="header-user">
          {/* <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
            {theme === 'light' ? (
              <Sun className="theme-icon sun" size={20} />
            ) : (
              <Moon className="theme-icon moon" size={20} />
            )}
          </button> */}
          <SignedOut>
            <div className="header-auth-buttons">
              <SignInButton mode="modal">
                <button className="header-signin-btn">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="header-signup-btn">Sign Up</button>
              </SignUpButton>
            </div>
          </SignedOut>
          <SignedIn>
            {isSignedIn && (
              <span className="header-user-greeting">
                Hi, {user.firstName || user.username || user.emailAddresses?.[0]?.emailAddress || user.phoneNumbers?.[0]?.phoneNumber}
              </span>
            )}
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'header-user-avatar' } }} />
          </SignedIn>
        </div>
      </div>
    </header>
  );
} 