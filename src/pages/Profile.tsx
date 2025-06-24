import { UserProfile, useUser } from '@clerk/clerk-react';
import { useTheme } from '../contexts/ThemeProvider';
import { Moon, Sun } from 'lucide-react';
import './Profile.css';

export default function Profile() {
  const { user } = useUser();
  const { theme, setTheme, toggleTheme } = useTheme();
  const notes = user?.unsafeMetadata.notes as any[] || [];

  return (
    <div className="profile-page-container">
      <div className="profile-header">
        <h1>User Profile</h1>
        <div className="theme-switcher">
          <button
            aria-label="Switch to light theme"
            style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 8 }}
            onClick={() => setTheme('light')}
            disabled={theme === 'light'}
          >
            <Sun color={theme === 'light' ? '#facc15' : '#888'} size={22} />
          </button>
          <button
            aria-label="Switch to dark theme"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => setTheme('dark')}
            disabled={theme === 'dark'}
          >
            <Moon color={theme === 'dark' ? '#60a5fa' : '#888'} size={22} />
          </button>
        </div>
      </div>

      <div className="user-stats-card">
        <h2>Your Stats</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <p className="stat-value">{notes.length}</p>
            <p className="stat-label">Total Notes Created</p>
          </div>
          <div className="stat-item">
            <p className="stat-value">{user?.lastSignInAt?.toLocaleDateString()}</p>
            <p className="stat-label">Last Sign In</p>
          </div>
        </div>
      </div>
      
      <div className="clerk-profile-wrapper">
         <UserProfile path="/profile" routing="path" />
      </div>
    </div>
  );
} 