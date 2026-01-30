const POSITION_KEY = 'bsky_timeline_position';

export function saveTimelinePosition(postUri, postCid) {
  localStorage.setItem(POSITION_KEY, JSON.stringify({ postUri, postCid, timestamp: Date.now() }));
}

export function getTimelinePosition() {
  try {
    const raw = localStorage.getItem(POSITION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearTimelinePosition() {
  localStorage.removeItem(POSITION_KEY);
}
