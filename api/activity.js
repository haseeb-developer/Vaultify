// In-memory store (for demo; use a DB for production)
/**
 * @typedef {Object} ActivityEntry
 * @property {string} userId
 * @property {string} username
 * @property {string} ip
 * @property {string} device
 * @property {string} os
 * @property {string} browser
 * @property {number} lastActive
 */
/** @type {ActivityEntry[]} */
let activityLog = [];

// Helper to get IP address
function getIp(req) {
  return (
    req.headers['x-forwarded-for']?.toString().split(',')[0] ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    null
  );
}

// Helper to get device info from user-agent
function parseUserAgent(ua) {
  if (!ua) return { device: 'Unknown', os: 'Unknown', browser: 'Unknown' };
  // Very basic parsing (use UAParser.js for more detail in production)
  let device = 'Desktop';
  if (/mobile/i.test(ua)) device = 'Mobile';
  if (/tablet/i.test(ua)) device = 'Tablet';
  let os =
    /windows/i.test(ua)
      ? 'Windows'
      : /mac/i.test(ua)
      ? 'MacOS'
      : /android/i.test(ua)
      ? 'Android'
      : /linux/i.test(ua)
      ? 'Linux'
      : /iphone|ipad|ipod/i.test(ua)
      ? 'iOS'
      : 'Unknown';
  let browser =
    /chrome/i.test(ua)
      ? 'Chrome'
      : /safari/i.test(ua)
      ? 'Safari'
      : /firefox/i.test(ua)
      ? 'Firefox'
      : /edge/i.test(ua)
      ? 'Edge'
      : /opera|opr/i.test(ua)
      ? 'Opera'
      : 'Unknown';
  return { device, os, browser };
}

export default function handler(req, res) {
  if (req.method === 'POST') {
    // Log a new activity
    const { userId, username } = req.body;
    const ip = getIp(req);
    const ua = req.headers['user-agent'] || '';
    const { device, os, browser } = parseUserAgent(ua);
    const now = Date.now();
    // Check if user already exists
    const existingIdx = activityLog.findIndex((a) => a.userId === userId);
    if (existingIdx !== -1) {
      // Update existing user
      activityLog[existingIdx] = {
        ...activityLog[existingIdx],
        username,
        ip,
        device,
        os,
        browser,
        lastActive: now,
      };
    } else {
      // Add new user
      activityLog.push({
        userId,
        username,
        ip,
        device,
        os,
        browser,
        lastActive: now,
      });
      // If more than 12 users, remove the oldest
      if (activityLog.length > 12) {
        // Sort by lastActive ascending and remove the oldest
        activityLog = activityLog
          .sort((a, b) => a.lastActive - b.lastActive)
          .slice(activityLog.length - 12);
      }
    }
    return res.status(200).json({ ok: true });
  }
  if (req.method === 'GET') {
    // Return all 12 users (latest by lastActive, descending)
    const now = Date.now();
    const activeUsers = activityLog.filter((a) => now - a.lastActive < 10 * 60 * 1000);
    const latest12 = [...activityLog]
      .sort((a, b) => b.lastActive - a.lastActive)
      .slice(0, 12);
    return res.status(200).json({
      activeCount: activeUsers.length,
      latest: latest12,
    });
  }
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 