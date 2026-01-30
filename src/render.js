export function renderPost(feedItem) {
  const post = feedItem.post;
  const reason = feedItem.reason;
  const reply = feedItem.reply;

  const article = document.createElement('article');
  article.className = 'post-card';
  article.dataset.postUri = post.uri;
  article.dataset.postCid = post.cid;

  let html = '';

  // Repost header
  if (reason?.$type === 'app.bsky.feed.defs#reasonRepost') {
    const by = reason.by;
    html += `<div class="repost-header">
      <svg class="icon-repost" viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M4.75 3.79l4.603 4.3-1.706 1.82L6 8.38v7.37c0 .97.784 1.75 1.75 1.75H13v2.5H7.75c-2.347 0-4.25-1.9-4.25-4.25V8.38L1.853 9.91.147 8.09l4.603-4.3zm11.5 2.71H11v-2.5h5.25c2.347 0 4.25 1.9 4.25 4.25v7.37l1.647-1.53 1.706 1.82-4.603 4.3-4.603-4.3 1.706-1.82L18 15.62V8.25c0-.97-.784-1.75-1.75-1.75z"/></svg>
      <span>Reposted by ${escapeHtml(by.displayName || by.handle)}</span>
    </div>`;
  }

  // Reply context
  if (reply?.parent) {
    const parent = reply.parent.author;
    html += `<div class="reply-context">
      <svg class="icon-reply" viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M12.24 2.32c.48-.64 1.47-.22 1.38.58l-.56 5.1h5.69c1.1 0 1.85 1.13 1.42 2.14l-4.3 10c-.25.6-.83.98-1.47.98H6.75C5.51 21.12 4.5 20.11 4.5 18.87V11.5c0-.56.22-1.1.61-1.5l7.13-7.68z"/></svg>
      <span>Reply to ${escapeHtml(parent.displayName || parent.handle)}</span>
    </div>`;
  }

  // Author row
  const author = post.author;
  const avatarUrl = author.avatar || '';
  html += `<div class="post-author">
    <img class="avatar" src="${escapeAttr(avatarUrl)}" alt="" loading="lazy" onerror="this.style.display='none'" />
    <div class="author-info">
      <span class="display-name">${escapeHtml(author.displayName || author.handle)}</span>
      <span class="handle">@${escapeHtml(author.handle)}</span>
    </div>
    <time class="post-time" datetime="${escapeAttr(post.indexedAt)}">${relativeTime(post.indexedAt)}</time>
  </div>`;

  // Post text
  const record = post.record;
  if (record?.text) {
    html += `<div class="post-text">${formatPostText(record)}</div>`;
  }

  // Embeds
  html += renderEmbed(post.embed);

  // Interaction counts
  html += `<div class="post-stats">
    <button class="stat-btn" title="Reply">
      <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12.24 2.32c.48-.64 1.47-.22 1.38.58l-.56 5.1h5.69c1.1 0 1.85 1.13 1.42 2.14l-4.3 10c-.25.6-.83.98-1.47.98H6.75C5.51 21.12 4.5 20.11 4.5 18.87V11.5c0-.56.22-1.1.61-1.5l7.13-7.68z"/></svg>
      <span>${formatCount(post.replyCount)}</span>
    </button>
    <button class="stat-btn" title="Repost">
      <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M4.75 3.79l4.603 4.3-1.706 1.82L6 8.38v7.37c0 .97.784 1.75 1.75 1.75H13v2.5H7.75c-2.347 0-4.25-1.9-4.25-4.25V8.38L1.853 9.91.147 8.09l4.603-4.3zm11.5 2.71H11v-2.5h5.25c2.347 0 4.25 1.9 4.25 4.25v7.37l1.647-1.53 1.706 1.82-4.603 4.3-4.603-4.3 1.706-1.82L18 15.62V8.25c0-.97-.784-1.75-1.75-1.75z"/></svg>
      <span>${formatCount(post.repostCount)}</span>
    </button>
    <button class="stat-btn" title="Like">
      <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
      <span>${formatCount(post.likeCount)}</span>
    </button>
  </div>`;

  article.innerHTML = html;

  // Make the post clickable to open on bsky.app
  article.addEventListener('click', (e) => {
    if (e.target.closest('a, button, img.embed-image')) return;
    const rkey = post.uri.split('/').pop();
    window.open(`https://bsky.app/profile/${author.handle}/post/${rkey}`, '_blank');
  });

  return article;
}

function renderEmbed(embed) {
  if (!embed) return '';

  // Images
  if (embed.$type === 'app.bsky.embed.images#view') {
    const count = embed.images.length;
    let html = `<div class="embed-images grid-${Math.min(count, 4)}">`;
    for (const img of embed.images) {
      html += `<img class="embed-image" src="${escapeAttr(img.thumb)}" alt="${escapeAttr(img.alt || '')}" loading="lazy" />`;
    }
    html += '</div>';
    return html;
  }

  // External link
  if (embed.$type === 'app.bsky.embed.external#view') {
    const ext = embed.external;
    let html = `<a class="embed-external" href="${escapeAttr(ext.uri)}" target="_blank" rel="noopener">`;
    if (ext.thumb) {
      html += `<img class="external-thumb" src="${escapeAttr(ext.thumb)}" alt="" loading="lazy" />`;
    }
    html += `<div class="external-info">
      <span class="external-title">${escapeHtml(ext.title || ext.uri)}</span>
      <span class="external-desc">${escapeHtml((ext.description || '').slice(0, 120))}</span>
      <span class="external-domain">${escapeHtml(getDomain(ext.uri))}</span>
    </div></a>`;
    return html;
  }

  // Record embed (quote post)
  if (embed.$type === 'app.bsky.embed.record#view' && embed.record?.value) {
    const rec = embed.record;
    const author = rec.author || {};
    let html = `<div class="embed-quote">
      <div class="quote-author">
        <img class="avatar-sm" src="${escapeAttr(author.avatar || '')}" alt="" loading="lazy" onerror="this.style.display='none'" />
        <span class="display-name">${escapeHtml(author.displayName || author.handle || '')}</span>
        <span class="handle">@${escapeHtml(author.handle || '')}</span>
      </div>`;
    if (rec.value?.text) {
      html += `<div class="quote-text">${escapeHtml(rec.value.text)}</div>`;
    }
    html += '</div>';
    return html;
  }

  // Record with media
  if (embed.$type === 'app.bsky.embed.recordWithMedia#view') {
    return renderEmbed(embed.media) + renderEmbed(embed.record);
  }

  // Video
  if (embed.$type === 'app.bsky.embed.video#view') {
    if (embed.playlist) {
      return `<div class="embed-video">
        <video controls preload="metadata" src="${escapeAttr(embed.playlist)}" poster="${escapeAttr(embed.thumbnail || '')}"></video>
      </div>`;
    }
    if (embed.thumbnail) {
      return `<div class="embed-video"><img class="embed-image" src="${escapeAttr(embed.thumbnail)}" alt="Video thumbnail" loading="lazy" /></div>`;
    }
  }

  return '';
}

function formatPostText(record) {
  let text = record.text;
  const facets = record.facets || [];

  if (!facets.length) return escapeHtml(text);

  // Build segments from facets, sorted by byte start
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const bytes = encoder.encode(text);

  const sorted = [...facets].sort((a, b) => a.index.byteStart - b.index.byteStart);

  let result = '';
  let lastEnd = 0;

  for (const facet of sorted) {
    const start = facet.index.byteStart;
    const end = facet.index.byteEnd;

    // Text before this facet
    result += escapeHtml(decoder.decode(bytes.slice(lastEnd, start)));

    const segment = decoder.decode(bytes.slice(start, end));
    const feature = facet.features?.[0];

    if (feature?.$type === 'app.bsky.richtext.facet#link') {
      result += `<a href="${escapeAttr(feature.uri)}" target="_blank" rel="noopener">${escapeHtml(segment)}</a>`;
    } else if (feature?.$type === 'app.bsky.richtext.facet#mention') {
      result += `<a href="https://bsky.app/profile/${escapeAttr(feature.did)}" target="_blank" rel="noopener">${escapeHtml(segment)}</a>`;
    } else if (feature?.$type === 'app.bsky.richtext.facet#tag') {
      result += `<a href="https://bsky.app/hashtag/${encodeURIComponent(feature.tag)}" target="_blank" rel="noopener">${escapeHtml(segment)}</a>`;
    } else {
      result += escapeHtml(segment);
    }

    lastEnd = end;
  }

  result += escapeHtml(decoder.decode(bytes.slice(lastEnd)));
  return result;
}

function relativeTime(isoString) {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(isoString).toLocaleDateString();
}

function formatCount(n) {
  if (!n) return '';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return escapeHtml(str);
}
