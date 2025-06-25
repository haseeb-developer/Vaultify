import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser } from '@clerk/clerk-react';
import { Sparkles } from 'lucide-react';
// import { useTheme } from '../contexts/ThemeProvider';

export default function Header() {
  const { isSignedIn, user } = useUser();
  // const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full px-2 sm:px-4 lg:px-10 py-3 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl border-b border-blue-200/40 dark:border-slate-800 rounded-b-3xl flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 transition-all duration-300 animate-fadeIn">
      {/* Left: Logo */}
      <div className="flex items-center gap-3 md:gap-6 flex-shrink-0 w-full md:w-auto justify-between md:justify-start">
        <Link to="/" className="flex items-center gap-2 text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-500 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg animate-neonPulse">
          <span className="animate-spinGlow"><Sparkles size={32} className="text-blue-400" /></span>
          <span className="hidden sm:inline-block">SAFE UR DATA</span>
        </Link>
      </div>
      {/* Center: Nav Links */}
      <nav className="flex-1 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6">
        <SignedIn>
          <Link
            to="/dashboard"
            className="relative px-5 py-2 rounded-full font-bold text-lg text-blue-700 dark:text-blue-200 bg-white/60 dark:bg-slate-800/60 shadow hover:bg-gradient-to-r hover:from-blue-400 hover:to-pink-400 hover:text-white transition-all duration-200 group overflow-hidden"
          >
            <span className="relative z-10">Dashboard</span>
            <span className="absolute left-0 bottom-0 w-0 h-1 bg-gradient-to-r from-blue-400 to-pink-400 rounded-full group-hover:w-full transition-all duration-300"></span>
          </Link>
          <Link
            to="/profile"
            className="relative px-5 py-2 rounded-full font-bold text-lg text-blue-700 dark:text-blue-200 bg-white/60 dark:bg-slate-800/60 shadow hover:bg-gradient-to-r hover:from-blue-400 hover:to-pink-400 hover:text-white transition-all duration-200 group overflow-hidden"
          >
            <span className="relative z-10">Profile</span>
            <span className="absolute left-0 bottom-0 w-0 h-1 bg-gradient-to-r from-blue-400 to-pink-400 rounded-full group-hover:w-full transition-all duration-300"></span>
          </Link>
        </SignedIn>
      </nav>
      {/* Right: Auth/User */}
      <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-end">
        {/* <button className="hidden md:inline-flex theme-toggle-btn p-2 rounded-full bg-white/60 dark:bg-slate-800/60 hover:bg-blue-100 dark:hover:bg-blue-900 shadow transition-all duration-200" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
          {theme === 'light' ? (
            <Sun className="theme-icon sun text-blue-400" size={20} />
          ) : (
            <Moon className="theme-icon moon text-blue-200" size={20} />
          )}
        </button> */}
        <SignedOut>
          <div className="flex gap-2 md:gap-4 w-full md:w-auto justify-end">
            <SignInButton mode="modal">
              <button className="px-5 py-2 rounded-full font-bold text-lg bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow hover:from-pink-400 hover:to-blue-400 hover:scale-105 active:scale-95 transition-all duration-200">Sign In</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-5 py-2 rounded-full font-bold text-lg bg-gradient-to-r from-pink-400 to-blue-400 text-white shadow hover:from-blue-400 hover:to-pink-400 hover:scale-105 active:scale-95 transition-all duration-200">Sign Up</button>
            </SignUpButton>
          </div>
        </SignedOut>
        <SignedIn>
          {isSignedIn && (
            <span className="hidden sm:inline-block font-bold text-blue-700 dark:text-blue-200 text-lg mr-2 animate-fadeIn">
              Hi, {user.firstName || user.username || user.emailAddresses?.[0]?.emailAddress || user.phoneNumbers?.[0]?.phoneNumber}
            </span>
          )}
          <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'ring-2 ring-blue-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 transition-all duration-200' } }} />
        </SignedIn>
      </div>
    </header>
  );
} 