import { getAgent } from './auth.js';
import { saveTimelinePosition, getTimelinePosition } from './storage.js';
import { renderPost } from './render.js';

let cursor = undefined;
let loading = false;
let reachedEnd = false;
let savedPosition = null;
let restoredPosition = false;
let visibilityObserver = null;

export function initTimeline(container) {
  savedPosition = getTimelinePosition();
  setupVisibilityTracking();
  loadPage(container);
  setupInfiniteScroll(container);
}

function setupVisibilityTracking() {
  visibilityObserver = new IntersectionObserver(
    (entries) => {
      let topVisiblePost = null;
      let topY = Infinity;

      for (const entry of entries) {
        if (entry.isIntersecting) {
          const rect = entry.boundingClientRect;
          if (rect.top < topY && rect.top >= 0) {
            topY = rect.top;
            topVisiblePost = entry.target;
          }
        }
      }

      if (topVisiblePost) {
        const uri = topVisiblePost.dataset.postUri;
        const cid = topVisiblePost.dataset.postCid;
        if (uri && cid) {
          saveTimelinePosition(uri, cid);
        }
      }
    },
    { threshold: 0.1 }
  );
}

async function loadPage(container) {
  if (loading || reachedEnd) return;
  loading = true;

  const spinner = document.getElementById('loading-spinner');
  if (spinner) spinner.classList.remove('hidden');

  const agent = getAgent();
  try {
    const res = await agent.getTimeline({ limit: 30, cursor });
    cursor = res.data.cursor;

    if (!res.data.feed.length) {
      reachedEnd = true;
      if (spinner) spinner.classList.add('hidden');
      loading = false;
      return;
    }

    const fragment = document.createDocumentFragment();
    for (const item of res.data.feed) {
      const postEl = renderPost(item);
      fragment.appendChild(postEl);
      visibilityObserver.observe(postEl);
    }
    container.appendChild(fragment);

    if (!restoredPosition && savedPosition) {
      tryRestorePosition(container);
    }

    if (!cursor) reachedEnd = true;
  } catch (err) {
    console.error('Failed to load timeline:', err);
    const errEl = document.createElement('div');
    errEl.className = 'error-message';
    errEl.textContent = 'Failed to load timeline. Pull down to retry.';
    container.appendChild(errEl);
  }

  if (spinner) spinner.classList.add('hidden');
  loading = false;
}

function tryRestorePosition(container) {
  const target = container.querySelector(`[data-post-uri="${CSS.escape(savedPosition.postUri)}"]`);
  if (target) {
    restoredPosition = true;
    target.scrollIntoView({ behavior: 'instant', block: 'start' });
    target.classList.add('restored-highlight');
    setTimeout(() => target.classList.remove('restored-highlight'), 2000);

    showRestoredBanner();
    return;
  }

  // Post not found yet — keep loading more pages to find it.
  // Give up after 10 pages (~300 posts) or 7 days old.
  const ageMs = Date.now() - (savedPosition.timestamp || 0);
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  if (ageMs > maxAge) {
    restoredPosition = true;
    return;
  }

  // Load another page to try to find the saved post
  if (!reachedEnd) {
    loadPage(container);
  }
}

function showRestoredBanner() {
  const banner = document.createElement('div');
  banner.className = 'restored-banner';
  banner.textContent = 'Returned to where you left off';
  document.body.appendChild(banner);
  setTimeout(() => {
    banner.classList.add('fade-out');
    setTimeout(() => banner.remove(), 500);
  }, 2500);
}

function setupInfiniteScroll(container) {
  const sentinel = document.createElement('div');
  sentinel.id = 'scroll-sentinel';
  container.after(sentinel);

  const scrollObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !loading && !reachedEnd) {
        loadPage(container);
      }
    },
    { rootMargin: '600px' }
  );
  scrollObserver.observe(sentinel);
}

export function resetTimeline(container) {
  cursor = undefined;
  loading = false;
  reachedEnd = false;
  restoredPosition = false;
  savedPosition = getTimelinePosition();
  container.innerHTML = '';
  const oldSentinel = document.getElementById('scroll-sentinel');
  if (oldSentinel) oldSentinel.remove();
  initTimeline(container);
}
