import { BskyAgent } from '@atproto/api';

const STORAGE_KEY = 'bsky_session';

let agent = null;

export function getAgent() {
  return agent;
}

export function getSavedSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
  agent = null;
}

export async function resumeSession() {
  const saved = getSavedSession();
  if (!saved) return false;

  agent = new BskyAgent({
    service: saved.service || 'https://bsky.social',
    persistSession: (_evt, sess) => {
      if (sess) saveSession({ ...sess, service: saved.service || 'https://bsky.social' });
    },
  });

  try {
    await agent.resumeSession(saved);
    return true;
  } catch {
    clearSession();
    return false;
  }
}

export async function login(identifier, password, service = 'https://bsky.social') {
  agent = new BskyAgent({
    service,
    persistSession: (_evt, sess) => {
      if (sess) saveSession({ ...sess, service });
    },
  });

  await agent.login({ identifier, password });
  return agent;
}
