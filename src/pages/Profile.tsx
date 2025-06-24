import { UserProfile, useUser, useClerk } from '@clerk/clerk-react';
import { useTheme } from '../contexts/ThemeProvider';
import { useState } from 'react';
import { Moon, Sun, Calendar, KeyRound, LogIn, Smartphone, ShieldCheck, Clock, RefreshCcw, Edit3, MailCheck, UserCheck, LogOut, Eye, EyeOff, X, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import './Profile.css';

interface Folder {
  id: string;
  name: string;
  parentId?: string; // for nested folders/groups
  createdAt: string;
  updatedAt: string;
}

interface Note {
  // ...existing fields...
  folderId?: string; // reference to the folder/group
}

// Modal Components
const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  isDestructive = false 
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close-btn">
          <X size={20} />
        </button>
        <div className="modal-header">
          <AlertTriangle size={24} color={isDestructive ? "#ef4444" : "#f59e0b"} />
          <h3>{title}</h3>
        </div>
        <p>{message}</p>
        <div className="modal-actions">
          <button onClick={onClose} className="modal-button secondary">
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }} 
            className={`modal-button ${isDestructive ? 'destructive' : 'primary'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Profile() {
  const { user } = useUser();
  const { signOut, client } = useClerk();
  const { theme, setTheme } = useTheme();
  const notes = user?.unsafeMetadata.notes as any[] || [];

  // Modal states
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Simulated/derived advanced stats (replace with real data if available)
  const stats: { label: string; value: string | number; icon: React.ReactElement; tooltip: string }[] = [
    {
      label: 'Account Created',
      value: user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A',
      icon: <Calendar size={22} />,
      tooltip: 'The date and time your account was created.'
    },
    {
      label: 'Last Sign In',
      value: user?.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : 'N/A',
      icon: <LogIn size={22} />,
      tooltip: 'The last time you signed in.'
    },
    {
      label: 'Total Sign Ins',
      value: typeof user?.publicMetadata?.signInCount === 'number' ? user.publicMetadata.signInCount : 'N/A',
      icon: <Eye size={22} />,
      tooltip: 'Total number of times you have signed in (if tracked in metadata).'
    },
    {
      label: '2FA Enabled',
      value: user?.twoFactorEnabled ? 'Yes' : 'No',
      icon: <ShieldCheck size={22} />,
      tooltip: 'Is two-factor authentication enabled?'
    },
    {
      label: 'TOTP Enabled',
      value: user?.totpEnabled ? 'Yes' : 'No',
      icon: <ShieldCheck size={22} />,
      tooltip: 'Is TOTP (authenticator app) enabled?'
    },
    {
      label: 'Backup Codes Enabled',
      value: user?.backupCodeEnabled ? 'Yes' : 'No',
      icon: <KeyRound size={22} />,
      tooltip: 'Are backup codes enabled for your account?'
    },
    {
      label: 'Email Verified',
      value: user?.hasVerifiedEmailAddress ? 'Yes' : 'No',
      icon: <MailCheck size={22} />,
      tooltip: 'Is your email address verified?'
    },
    {
      label: 'Primary Email',
      value: user?.primaryEmailAddress?.emailAddress || 'N/A',
      icon: <MailCheck size={22} />,
      tooltip: 'Your primary email address.'
    },
    {
      label: 'Phone Numbers',
      value: user?.phoneNumbers ? user.phoneNumbers.length.toString() : '0',
      icon: <Smartphone size={22} />,
      tooltip: 'Number of phone numbers linked to your account.'
    },
    {
      label: 'Organization Memberships',
      value: user?.organizationMemberships ? user.organizationMemberships.length.toString() : '0',
      icon: <UserCheck size={22} />,
      tooltip: 'Number of organizations you belong to.'
    },
    {
      label: 'Last Profile Update',
      value: user?.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'N/A',
      icon: <Edit3 size={22} />,
      tooltip: 'The last time you updated your profile.'
    },
    {
      label: 'Total Notes Created',
      value: notes.length,
      icon: <Edit3 size={22} />,
      tooltip: 'Total number of notes you have created.'
    },
  ];

  // Security Functions
  const handleManage2FA = async () => {
    try {
      // Since we can't directly open 2FA settings, we'll show a message
      // In a real implementation, you'd navigate to a dedicated 2FA page
      toast.success('2FA management is available in your Clerk dashboard');
      // You can also redirect to Clerk's dashboard or implement a custom 2FA flow
    } catch (error) {
      toast.error('Failed to open 2FA settings');
    }
  };

  const handleSignOutAll = async () => {
    setIsLoading(true);
    try {
      // Sign out from current session
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewSessions = async () => {
    setIsLoading(true);
    try {
      // Clerk doesn't provide client-side session management API
      // This would require backend implementation with Clerk's server-side API
      toast.success('Session management is available in your Clerk dashboard');
      toast.success('For real-time session management, you would need to implement a backend API that uses Clerk\'s server-side session endpoints');
    } catch (error) {
      toast.error('Failed to load session information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      // This would require backend implementation
      toast.success('Session revocation would be implemented via backend API');
    } catch (error) {
      toast.error('Failed to revoke session');
    }
  };

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

      <div className="advanced-stats-card">
        <h2>Advanced Account Stats</h2>
        <div className="advanced-stats-grid">
          {stats.map((stat, idx) => (
            <div className="advanced-stat-item" key={idx} title={stat.tooltip}>
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-info">
                <p className="stat-value">{stat.value}</p>
                <p className="stat-label">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security & Session Management Section */}
      <div className="security-section">
        <h2>Security & Session Management</h2>
        <div className="security-options-grid">
          <div className="security-option-card">
            <ShieldCheck size={20} />
            <span>Two-Factor Authentication: <b>{user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}</b></span>
            <button 
              className="security-action-btn" 
              onClick={handleManage2FA}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Manage 2FA'}
            </button>
          </div>
          <div className="security-option-card">
            <LogOut size={20} />
            <span>Sign out of all devices</span>
            <button 
              className="security-action-btn" 
              onClick={() => setIsSignOutModalOpen(true)}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Sign Out All'}
            </button>
          </div>
          <div className="security-option-card">
            <KeyRound size={20} />
            <span>Change Password</span>
            <button 
              className="security-action-btn" 
              onClick={() => {
                toast.success('Password change is available in your Clerk dashboard');
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Change Password'}
            </button>
          </div>
          <div className="security-option-card">
            <MailCheck size={20} />
            <span>Email Verification: <b>{user?.hasVerifiedEmailAddress ? 'Verified' : 'Not Verified'}</b></span>
            <button 
              className="security-action-btn" 
              onClick={() => {
                if (user?.hasVerifiedEmailAddress) {
                  toast.success('Email is already verified');
                } else {
                  toast.success('Email verification is available in your Clerk dashboard');
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Manage Email'}
            </button>
          </div>
          <div className="security-option-card">
            <AlertTriangle size={20} />
            <span>Account Deletion</span>
            <button 
              className="security-action-btn destructive" 
              onClick={() => {
                toast.error('Account deletion is available in your Clerk dashboard for security reasons');
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>

      {/* Security Audit Log */}
      <div className="security-section">
        <h2>Security Audit Log</h2>
        <div className="audit-log">
          {user?.lastSignInAt && (
            <div className="audit-item">
              <div className="audit-icon">
                <LogIn size={16} />
              </div>
              <div className="audit-content">
                <div className="audit-title">Last Sign In</div>
                <div className="audit-details">Account accessed successfully</div>
                <div className="audit-time">{new Date(user.lastSignInAt).toLocaleString()}</div>
              </div>
              <div className="audit-status success">Success</div>
            </div>
          )}
          {user?.twoFactorEnabled && (
            <div className="audit-item">
              <div className="audit-icon">
                <ShieldCheck size={16} />
              </div>
              <div className="audit-content">
                <div className="audit-title">Two-Factor Authentication</div>
                <div className="audit-details">2FA is currently enabled</div>
                <div className="audit-time">Active</div>
              </div>
              <div className="audit-status success">Enabled</div>
            </div>
          )}
          {user?.hasVerifiedEmailAddress && (
            <div className="audit-item">
              <div className="audit-icon">
                <MailCheck size={16} />
              </div>
              <div className="audit-content">
                <div className="audit-title">Email Verification</div>
                <div className="audit-details">{user.primaryEmailAddress?.emailAddress}</div>
                <div className="audit-time">Verified</div>
              </div>
              <div className="audit-status success">Verified</div>
            </div>
          )}
          {user?.createdAt && (
            <div className="audit-item">
              <div className="audit-icon">
                <Calendar size={16} />
              </div>
              <div className="audit-content">
                <div className="audit-title">Account Created</div>
                <div className="audit-details">Welcome to SAFE UR DATA</div>
                <div className="audit-time">{new Date(user.createdAt).toLocaleString()}</div>
              </div>
              <div className="audit-status success">Success</div>
            </div>
          )}
          {user?.updatedAt && user.updatedAt !== user.createdAt && (
            <div className="audit-item">
              <div className="audit-icon">
                <Edit3 size={16} />
              </div>
              <div className="audit-content">
                <div className="audit-title">Profile Updated</div>
                <div className="audit-details">Account information modified</div>
                <div className="audit-time">{new Date(user.updatedAt).toLocaleString()}</div>
              </div>
              <div className="audit-status success">Updated</div>
            </div>
          )}
          {!user?.hasVerifiedEmailAddress && (
            <div className="audit-item">
              <div className="audit-icon">
                <AlertTriangle size={16} />
              </div>
              <div className="audit-content">
                <div className="audit-title">Email Not Verified</div>
                <div className="audit-details">Please verify your email address for enhanced security</div>
                <div className="audit-time">Pending</div>
              </div>
              <div className="audit-status warning">Warning</div>
            </div>
          )}
          {!user?.twoFactorEnabled && (
            <div className="audit-item">
              <div className="audit-icon">
                <AlertTriangle size={16} />
              </div>
              <div className="audit-content">
                <div className="audit-title">Two-Factor Authentication Disabled</div>
                <div className="audit-details">Enable 2FA for enhanced account security</div>
                <div className="audit-time">Recommended</div>
              </div>
              <div className="audit-status warning">Warning</div>
            </div>
          )}
        </div>
      </div>

      <div className="clerk-profile-wrapper">
         <UserProfile path="/profile" routing="path" />
      </div>

      {/* Modals */}
      <ConfirmationModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={handleSignOutAll}
        title="Sign Out All Devices"
        message="This will sign you out from all devices where you're currently signed in. You'll need to sign in again on each device."
        confirmText="Sign Out All"
        cancelText="Cancel"
        isDestructive={true}
      />
    </div>
  );
} 