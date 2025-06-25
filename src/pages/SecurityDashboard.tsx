import { useUser, useClerk } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { LogIn, LogOut, Smartphone, ShieldCheck, Edit3, X, AlertTriangle, UserCheck, KeyRound, MailCheck, Eye } from 'lucide-react';

export default function SecurityDashboard() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [sessionList, setSessionList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sessions (Clerk API)
  useEffect(() => {
    async function fetchSessions() {
      setLoading(true);
      setError(null);
      try {
        // Clerk's session API (if available)
        if (user && user.getSessions) {
          const sess = await user.getSessions();
          setSessionList(sess);
        } else {
          setSessionList([]);
        }
      } catch (e) {
        setError('Could not fetch sessions.');
      }
      setLoading(false);
    }
    fetchSessions();
  }, [user]);

  // Demo audit log (replace with real Clerk metadata if available)
  const auditLog = (user?.unsafeMetadata?.auditLog as any[]) || [
    { type: 'login', time: new Date().toLocaleString(), device: 'Chrome on Mac', ip: '192.168.1.2' },
    { type: 'note_edit', time: new Date().toLocaleString(), note: 'My Secure Note' },
    { type: 'password_change', time: new Date().toLocaleString() },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-blue-950 to-neutral-900 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-3xl bg-white/10 rounded-3xl shadow-2xl border border-blue-900/30 p-8 flex flex-col gap-10 animate-fadeIn">
        <h1 className="text-3xl font-extrabold text-blue-200 mb-2 tracking-tight flex items-center gap-3"><ShieldCheck size={32} className="text-blue-400" /> Security Dashboard</h1>
        {/* Audit Log */}
        <section>
          <h2 className="text-xl font-bold text-blue-100 mb-4 flex items-center gap-2"><Eye size={20} className="text-blue-300" /> Recent Activity</h2>
          <div className="flex flex-col gap-3">
            {auditLog.length === 0 && <div className="text-blue-200">No recent activity.</div>}
            {auditLog.map((event, i) => (
              <div key={i} className="flex items-center gap-4 bg-neutral-800/80 rounded-xl px-5 py-4 border border-blue-900/20 shadow-sm">
                {event.type === 'login' && <LogIn size={22} className="text-green-400" />}
                {event.type === 'logout' && <LogOut size={22} className="text-red-400" />}
                {event.type === 'note_edit' && <Edit3 size={22} className="text-blue-400" />}
                {event.type === 'password_change' && <KeyRound size={22} className="text-yellow-400" />}
                <div className="flex-1">
                  <div className="font-semibold text-blue-100">
                    {event.type === 'login' && 'Logged in'}
                    {event.type === 'logout' && 'Logged out'}
                    {event.type === 'note_edit' && `Edited note: ${event.note}`}
                    {event.type === 'password_change' && 'Changed password'}
                  </div>
                  <div className="text-xs text-blue-300 mt-1">
                    {event.time} {event.device && `· ${event.device}`} {event.ip && `· IP: ${event.ip}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        {/* Sessions */}
        <section>
          <h2 className="text-xl font-bold text-blue-100 mb-4 flex items-center gap-2"><Smartphone size={20} className="text-blue-300" /> Active Sessions</h2>
          {loading && <div className="text-blue-200">Loading sessions…</div>}
          {error && <div className="text-red-400">{error}</div>}
          {!loading && sessionList.length === 0 && <div className="text-blue-200">No active sessions found.</div>}
          <div className="flex flex-col gap-3">
            {sessionList.map((session: any) => (
              <div key={session.id} className="flex items-center gap-4 bg-neutral-800/80 rounded-xl px-5 py-4 border border-blue-900/20 shadow-sm">
                <Smartphone size={22} className="text-blue-400" />
                <div className="flex-1">
                  <div className="font-semibold text-blue-100">{session.userAgent || 'Unknown Device'}</div>
                  <div className="text-xs text-blue-300 mt-1">{session.lastActiveAt ? new Date(session.lastActiveAt).toLocaleString() : ''}</div>
                </div>
                <button
                  className="ml-2 px-4 py-2 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 transition-all"
                  onClick={async () => {
                    if (window.confirm('Log out this session?')) {
                      await signOut({ sessionId: session.id });
                      setSessionList((prev) => prev.filter((s) => s.id !== session.id));
                    }
                  }}
                >Log out</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
} 