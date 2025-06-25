import { useEffect, useState } from 'react';

function WifiAnimatedIcon() {
  // Animated SVG wifi arcs with pulse
  return (
    <svg width="100" height="100" viewBox="0 0 54 54" fill="none" className="mr-5 animate-pulse-super" aria-hidden="true">
      <circle cx="27" cy="27" r="27" fill="none" />
      <g>
        <path className="wifi-arc arc1" d="M14 34c7.5-7.5 18.5-7.5 26 0" stroke="#60a5fa" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path className="wifi-arc arc2" d="M20 40c4-4 10-4 14 0" stroke="#3b82f6" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <circle className="wifi-dot" cx="27" cy="46" r="2.7" fill="#2563eb" />
      </g>
      <style>{`
        .wifi-arc.arc1 { stroke-dasharray: 36; stroke-dashoffset: 36; animation: arc1 1.4s cubic-bezier(.4,0,.2,1) infinite alternate; }
        .wifi-arc.arc2 { stroke-dasharray: 18; stroke-dashoffset: 18; animation: arc2 1.4s cubic-bezier(.4,0,.2,1) infinite alternate; }
        .wifi-dot { opacity: 0.7; animation: dot 1.4s cubic-bezier(.4,0,.2,1) infinite alternate; }
        @keyframes arc1 { to { stroke-dashoffset: 0; } }
        @keyframes arc2 { to { stroke-dashoffset: 0; } }
        @keyframes dot { 0% { opacity: 0.7; } 100% { opacity: 1; } }
        .animate-pulse-super { animation: pulse-super 1.5s cubic-bezier(.4,0,.2,1) infinite; }
        @keyframes pulse-super { 0%,100% { filter: drop-shadow(0 0 0 #3b82f6); } 50% { filter: drop-shadow(0 0 16px #3b82f6cc); } }
      `}</style>
    </svg>
  );
}

export default function ConnectionStatusOverlay() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [visible, setVisible] = useState(offline);

  useEffect(() => {
    if (offline) {
      setVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      setTimeout(() => setVisible(false), 450);
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [offline]);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!visible && !offline) return null;

  return (
    <div
      className={`fixed top-0 left-0 w-full z-[200] flex items-center justify-center transition-all duration-500 ${offline ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-20 pointer-events-none'} bg-neutral-900 border-b-4 border-blue-500`}
      aria-modal="true"
      role="alert"
      tabIndex={-1}
      style={{ minHeight: '100%' }}
    >
      <div className="flex items-center justify-center w-full max-w-3xl px-6 py-6">
        <WifiAnimatedIcon />
        <div className="flex flex-col items-start justify-center">
          <span className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent tracking-tight animate-underline-shimmer relative">
            Connection Lost
            <span className="block h-1 w-full bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 rounded-full mt-2 animate-shimmer-bar absolute left-0 bottom-[-10px] opacity-70" />
          </span>
          <span className="mt-2 text-lg sm:text-xl font-semibold text-blue-100 animate-fadeIn pt-6">Please check your internet connection. Trying to reconnect…</span>
        </div>
      </div>
      <style>{`
        .animate-underline-shimmer {
          position: relative;
        }
        .animate-shimmer-bar {
          background-size: 200% 100%;
          animation: shimmer-bar 2.2s linear infinite;
        }
        @keyframes shimmer-bar {
          0% { background-position: -200px 0; }
          100% { background-position: 200px 0; }
        }
      `}</style>
    </div>
  );
} 