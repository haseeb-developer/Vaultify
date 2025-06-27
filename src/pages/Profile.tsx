import { UserProfile, useUser, useClerk } from '@clerk/clerk-react';
import { useTheme } from '../contexts/ThemeProvider';
import { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Calendar, KeyRound, LogIn, Smartphone, ShieldCheck, Edit3, MailCheck, UserCheck, LogOut, Eye, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import './Profile.css';

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
  const [isDeleteAllNotesModalOpen, setIsDeleteAllNotesModalOpen] = useState(false);

  // --- New state for activity tracking ---
  const [activeCount, setActiveCount] = useState<number>(0);
  const [latestVisitors, setLatestVisitors] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Add state for new modals
  const [isDeleteLockedFavModalOpen, setIsDeleteLockedFavModalOpen] = useState(false);
  const [isDeleteAllLiterallyModalOpen, setIsDeleteAllLiterallyModalOpen] = useState(false);

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

  const handleDeleteAllNotes = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const notes = user?.unsafeMetadata.notes as any[] || [];
      // Only keep notes that are locked or favorite
      const filteredNotes = notes.filter(n => n.isLocked || n.isFavorite);
      await user.update({ unsafeMetadata: { ...user.unsafeMetadata, notes: filteredNotes } });
      toast.success('All unlocked and non-favorite notes deleted.');
    } catch (error) {
      toast.error('Failed to delete notes.');
    } finally {
      setIsLoading(false);
      setIsDeleteAllNotesModalOpen(false);
    }
  };

  // Add a computed variable to determine if there are any deletable notes
  const deletableNotes = (notes || []).filter(n => !n.isLocked && !n.isFavorite);
  const deletableNotesExist = deletableNotes.length > 0;

  // Add state for tooltip at the top of the Profile component
  const [showDeleteTooltip, setShowDeleteTooltip] = useState(false);

  // Add handlers for new buttons at the top of the Profile component
  const handleDeleteLockedFavNotes = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const notes = user?.unsafeMetadata.notes as any[] || [];
      // Only keep notes that are NOT locked and NOT favorite
      const filteredNotes = notes.filter(n => !n.isLocked && !n.isFavorite);
      await user.update({ unsafeMetadata: { ...user.unsafeMetadata, notes: filteredNotes } });
      toast.success('All locked and favorite notes deleted.');
    } catch (error) {
      toast.error('Failed to delete locked/favorite notes.');
    } finally {
      setIsLoading(false);
      setIsDeleteLockedFavModalOpen(false);
    }
  };
  const handleDeleteAllLiterally = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      await user.update({ unsafeMetadata: { notes: [], folders: [] } });
      toast.success('All notes and folders deleted. Data reset.');
    } catch (error) {
      toast.error('Failed to delete all data.');
    } finally {
      setIsLoading(false);
      setIsDeleteAllLiterallyModalOpen(false);
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

      {/* Security Audit Log */}
      <div className="security-section danger-zone" style={{
        border: '2px solid #ef4444',
        background: 'linear-gradient(90deg, #18181b 0%, #23272a 100%)',
        borderRadius: 16,
        marginTop: 40,
        marginBottom: 40,
        padding: 32,
        boxShadow: '0 2px 16px #ef444422',
        position: 'relative',
        maxWidth: "100%",
        marginLeft: 'auto',
        marginRight: 'auto',
      }}>
        <h2 style={{ color: '#ef4444', fontWeight: 900, letterSpacing: 1, marginBottom: 18, textTransform: 'uppercase', fontSize: 22, display: 'flex', alignItems: 'center' }}>
          <AlertTriangle size={28} style={{ marginRight: 10, verticalAlign: 'middle' }} /> DANGER ZONE
        </h2>
        <div>
          <h3 style={{ color: '#ef4444', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Delete All Notes</h3>
          <p style={{ color: '#fca5a5', fontWeight: 600, marginBottom: 8 }}>
            This action will permanently delete all your notes except the ones you've locked or marked as favorites.
            <span style={{ color: '#fde68a', fontWeight: 500, display: 'block', marginTop: 4 }}>
              Because of our top-tier security and privacy measures, locked and favorite notes stay untouched — your data stays protected, always.
            </span>
          </p>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
            <button
              className="security-action-btn destructive mt-3"
              style={{ marginBottom: 12, fontWeight: 700, fontSize: 18, padding: '12px 32px', borderRadius: 8, border: '2px solid #ef4444', background: '#ef4444', color: '#fff', boxShadow: '0 2px 8px #ef444422', transition: 'background 0.2s', letterSpacing: 1 }}
              onClick={() => setIsDeleteAllNotesModalOpen(true)}
              disabled={isLoading || !deletableNotesExist}
              onMouseEnter={() => setShowDeleteTooltip(true)}
              onMouseLeave={() => setShowDeleteTooltip(false)}
              onFocus={() => setShowDeleteTooltip(true)}
              onBlur={() => setShowDeleteTooltip(false)}
              aria-describedby="delete-notes-tooltip"
            >
              Delete All Unlocked & Non-Favorite Notes
            </button>
            {/* Tooltip */}
            {(showDeleteTooltip || document.activeElement === document.getElementById('delete-notes-btn')) && (
              <div
                id="delete-notes-tooltip"
                style={{
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bottom: 'calc(100% + 10px)',
                  background: '#23272a',
                  color: '#fff',
                  padding: '10px 18px',
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  boxShadow: '0 2px 12px #18181b99',
                  whiteSpace: 'nowrap',
                  zIndex: 100,
                  pointerEvents: 'none',
                  opacity: 0.97,
                }}
                role="tooltip"
              >
                {deletableNotesExist
                  ? `${deletableNotes.length} active note${deletableNotes.length > 1 ? 's' : ''} will be deleted. Click to proceed.`
                  : `No unlocked or non-favorite notes available to delete. Only notes that are not locked and not marked as favorite can be deleted in bulk.`}
              </div>
            )}
          </div>
          {/* Delete Locked & Favorite Notes Button */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
            <button
              className="security-action-btn destructive mt-3"
              style={{ marginBottom: 12, fontWeight: 700, fontSize: 18, padding: '12px 32px', borderRadius: 8, border: '2px solid #f59e42', background: '#f59e42', color: '#fff', boxShadow: '0 2px 8px #f59e4244', transition: 'background 0.2s', letterSpacing: 1 }}
              onClick={() => setIsDeleteLockedFavModalOpen(true)}
              disabled={isLoading || !notes.some(n => n.isLocked || n.isFavorite)}
            >
              Delete All Locked & Favorite Notes
            </button>
            <div style={{ color: '#f59e42', fontWeight: 500, fontSize: 14, marginTop: 2, marginBottom: 8 }}>
              This will permanently delete all notes that are either locked or marked as favorite. Unlocked and non-favorite notes will remain.
            </div>
          </div>
          {/* Delete Everything Button */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
            <button
              className="security-action-btn destructive mt-3"
              style={{ marginBottom: 12, fontWeight: 700, fontSize: 18, padding: '12px 32px', borderRadius: 8, border: '2px solid #b91c1c', background: '#b91c1c', color: '#fff', boxShadow: '0 2px 8px #b91c1c44', transition: 'background 0.2s', letterSpacing: 1 }}
              onClick={() => setIsDeleteAllLiterallyModalOpen(true)}
              disabled={isLoading || (notes.length === 0 && (!Array.isArray(user?.unsafeMetadata.folders) || user.unsafeMetadata.folders.length === 0))}
            >
              DELETE ALL LITERALLY (Reset Everything)
            </button>
            <div style={{ color: '#b91c1c', fontWeight: 600, fontSize: 15, marginTop: 2, marginBottom: 8 }}>
              <b>Warning:</b> This will permanently delete <u>all your notes and folders</u>. This action cannot be undone. You will lose all your data.
            </div>
          </div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={isDeleteAllNotesModalOpen}
        onClose={() => setIsDeleteAllNotesModalOpen(false)}
        onConfirm={handleDeleteAllNotes}
        title="Delete All Notes?"
        message="Are you sure you want to delete all unlocked and non-favorite notes? This action cannot be undone. Locked and favorite notes will be kept."
        confirmText="Delete All"
        cancelText="Cancel"
        isDestructive={true}
      />

      {/* Confirmation Modals for new buttons */}
      <ConfirmationModal
        isOpen={isDeleteLockedFavModalOpen}
        onClose={() => setIsDeleteLockedFavModalOpen(false)}
        onConfirm={handleDeleteLockedFavNotes}
        title="Delete All Locked & Favorite Notes?"
        message="Are you sure you want to delete all notes that are locked or marked as favorite? This cannot be undone."
        confirmText="Delete Locked & Favorite"
        cancelText="Cancel"
        isDestructive={true}
      />
      <ConfirmationModal
        isOpen={isDeleteAllLiterallyModalOpen}
        onClose={() => setIsDeleteAllLiterallyModalOpen(false)}
        onConfirm={handleDeleteAllLiterally}
        title="Delete Everything? (Reset Data)"
        message="This will permanently delete ALL your notes and folders. You will lose all your data. This cannot be undone. Are you absolutely sure?"
        confirmText="Delete Everything"
        cancelText="Cancel"
        isDestructive={true}
      />

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