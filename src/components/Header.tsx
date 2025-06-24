import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser } from '@clerk/clerk-react';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeProvider';
import './Header.css';

export default function Header() {
  const { isSignedIn, user } = useUser();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="header glassy-header">
      <div className="header-left">
        <Link to="/" className="logo neon-glow">
          <span className="logo-icon"><Sparkles size={28} /></span>
          <span className="logo-text">SAFE UR DATA</span>
        </Link>
     
      </div>
      <div className="header-center">
      <SignedIn>
          <nav className="nav-links">
            <Link to="/dashboard" className="nav-link nav-animated">Dashboard</Link>
            <Link to="/profile" className="nav-link nav-animated">Profile</Link>
          </nav>
        </SignedIn>
      </div>
      <div className="header-right">
        <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
          {theme === 'light' ? (
            <Sun className="theme-icon sun" size={20} />
          ) : (
            <Moon className="theme-icon moon" size={20} />
          )}
        </button>
        <SignedOut>
          <div className="auth-buttons">
            <SignInButton mode="modal">
              <button className="auth-button">Sign In</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="auth-button signup">Sign Up</button>
            </SignUpButton>
          </div>
        </SignedOut>
        <SignedIn>
          {isSignedIn && <span className="user-greeting">Hi, {user.firstName}</span>}
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </header>
  );
} 