import './styles.css';
import { login, resumeSession, clearSession, getAgent } from './auth.js';
import { initTimeline, resetTimeline } from './timeline.js';
import { clearTimelinePosition } from './storage.js';

const app = document.getElementById('app');

async function boot() {
  const resumed = await resumeSession();
  if (resumed) {
    showTimeline();
  } else {
    showLogin();
  }
}

function showLogin() {
  app.innerHTML = `
    <div class="login-screen">
      <div class="login-card">
        <h1>Bluesky Timeline</h1>
        <p class="subtitle">Sign in to view your timeline</p>
        <form id="login-form">
          <div class="form-group">
            <label for="identifier">Handle or email</label>
            <input id="identifier" type="text" placeholder="you.bsky.social" autocomplete="username" required />
          </div>
          <div class="form-group">
            <label for="password">App password</label>
            <input id="password" type="password" placeholder="xxxx-xxxx-xxxx-xxxx" autocomplete="current-password" required />
          </div>
          <div class="form-group">
            <label for="service">Service URL</label>
            <input id="service" type="url" value="https://bsky.social" />
          </div>
          <button type="submit" class="login-btn">Sign in</button>
          <p id="login-error" class="login-error"></p>
        </form>
        <p class="login-hint">
          Use an <a href="https://bsky.app/settings/app-passwords" target="_blank" rel="noopener">App Password</a>, not your account password.
        </p>
      </div>
    </div>
  `;

  const form = document.getElementById('login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.login-btn');
    const errEl = document.getElementById('login-error');

    const identifier = document.getElementById('identifier').value.trim();
    const password = document.getElementById('password').value;
    const service = document.getElementById('service').value.trim() || 'https://bsky.social';

    btn.disabled = true;
    btn.textContent = 'Signing in...';
    errEl.classList.remove('visible');

    try {
      await login(identifier, password, service);
      showTimeline();
    } catch (err) {
      errEl.textContent = err.message || 'Login failed. Check your credentials.';
      errEl.classList.add('visible');
      btn.disabled = false;
      btn.textContent = 'Sign in';
    }
  });
}

function showTimeline() {
  const agent = getAgent();
  const profile = agent.session;

  app.innerHTML = `
    <div class="timeline-wrapper">
      <header class="app-header">
        <span class="header-title">Timeline</span>
        <div class="header-actions">
          <button id="btn-refresh" class="header-btn" title="Refresh">Refresh</button>
          <button id="btn-top" class="header-btn" title="Scroll to new">New</button>
          <button id="btn-logout" class="header-btn" title="Sign out">Sign out</button>
        </div>
      </header>
      <div id="timeline-feed" class="timeline-feed"></div>
      <div id="loading-spinner"><div class="spinner"></div></div>
    </div>
  `;

  const feed = document.getElementById('timeline-feed');

  document.getElementById('btn-refresh').addEventListener('click', () => {
    resetTimeline(feed);
  });

  document.getElementById('btn-top').addEventListener('click', () => {
    clearTimelinePosition();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.getElementById('btn-logout').addEventListener('click', () => {
    clearSession();
    clearTimelinePosition();
    showLogin();
  });

  initTimeline(feed);
}

boot();
