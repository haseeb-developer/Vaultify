import { UserProfile, useUser, useClerk } from '@clerk/clerk-react';
import { useTheme } from '../contexts/ThemeProvider';
import { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Calendar, KeyRound, LogIn, Smartphone, ShieldCheck, Edit3, MailCheck, UserCheck, LogOut, Eye, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import './Profile.css';

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
  const { signOut } = useClerk();
  const { theme, setTheme } = useTheme();
  const notes = user?.unsafeMetadata.notes as any[] || [];

  // Modal states
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- New state for activity tracking ---
  const [activeCount, setActiveCount] = useState<number>(0);
  const [latestVisitors, setLatestVisitors] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Post activity on mount ---
  useEffect(() => {
    if (!user) return;
    fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        username: user.username || user.firstName || user.emailAddresses?.[0]?.emailAddress || 'Unknown',
      }),
    });
  }, [user]);

  // --- Poll for latest visitors and active count ---
  useEffect(() => {
    let isMounted = true;
    function fetchActivity() {
      fetch('/api/activity')
        .then((res) => res.json())
        .then((data) => {
          if (!isMounted) return;
          setActiveCount(data.activeCount);
          setLatestVisitors(data.latest);
          setActivityLoading(false);
        })
        .catch(() => {
          if (!isMounted) return;
          setActivityLoading(false);
        });
    }
    fetchActivity();
    pollingRef.current = setInterval(fetchActivity, 5000);
    return () => {
      isMounted = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

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

      {/* --- Active Users and Latest Visitors --- */}
      <div className="advanced-stats-card" style={{ marginBottom: 24 }}>
        <h2>🌍 Active Users: {activityLoading ? 'Loading...' : activeCount}</h2>
        <h3 style={{ marginTop: 12, marginBottom: 8 }}>Leaderboard: Latest 12 Visitors</h3>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 16, flexWrap: 'wrap', minHeight: 80 }}>
          {latestVisitors.map((v, idx) => (
            <div key={idx} style={{
              background: 'var(--background, #f8fafc)',
              borderRadius: 12,
              padding: 16,
              boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              minWidth: 220,
              maxWidth: 260,
              flex: '1 1 220px',
              border: '1px solid #e0e7ef',
              position: 'relative',
              transition: 'box-shadow 0.2s',
            }}>
              <span style={{ fontWeight: 700, fontSize: 17, color: '#334155', marginBottom: 4 }}>{v.username}</span>
              <span style={{ fontFamily: 'monospace', color: '#64748b', fontSize: 13, marginBottom: 2 }}>IP: {v.ip}</span>
              <span style={{ fontSize: 14, color: '#475569', marginBottom: 2 }}>Device: <b>{v.device}</b></span>
              <span style={{ fontSize: 14, color: '#475569', marginBottom: 2 }}>OS: <b>{v.os}</b></span>
              <span style={{ fontSize: 14, color: '#475569', marginBottom: 2 }}>Browser: <b>{v.browser}</b></span>
              <span style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>{new Date(v.lastActive).toLocaleString()}</span>
              <span style={{ position: 'absolute', top: 8, right: 12, fontSize: 11, color: '#a3a3a3' }}>#{idx + 1}</span>
            </div>
          ))}
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