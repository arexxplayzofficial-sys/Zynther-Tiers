const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');

function readJSON(file, fallback = {}) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJSON(file, data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getSessions() {
  return readJSON(SESSIONS_FILE, {});
}

function saveSession(guildId, session) {
  const sessions = getSessions();
  sessions[guildId] = session;
  writeJSON(SESSIONS_FILE, sessions);
}

function deleteSession(guildId) {
  const sessions = getSessions();
  delete sessions[guildId];
  writeJSON(SESSIONS_FILE, sessions);
}

function getLeaderboard() {
  return readJSON(LEADERBOARD_FILE, {});
}

function updateLeaderboard(items) {
  const lb = getLeaderboard();
  for (const [item, tier] of Object.entries(items)) {
    const tierScore = { S: 6, A: 5, B: 4, C: 3, D: 2, F: 1 };
    if (!lb[item]) lb[item] = { votes: 0, totalScore: 0 };
    lb[item].votes += 1;
    lb[item].totalScore += tierScore[tier] || 0;
  }
  writeJSON(LEADERBOARD_FILE, lb);
}

module.exports = { getSessions, saveSession, deleteSession, getLeaderboard, updateLeaderboard };
