const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function isDirectMediaUrl(u = '') {
  try {
    const url = new URL(u, window.location.origin);
    if (/youtube\.com|youtu\.be|vimeo\.com/i.test(url.hostname)) return false;
    const p = url.pathname.toLowerCase();
    return p.endsWith('.mp4') || p.endsWith('.webm') || p.endsWith('.ogg') || p.endsWith('.ogv') || p.endsWith('.m3u8');
  } catch {
    return false;
  }
}

function mimeFromUrl(u = '') {
  const lower = u.toLowerCase();
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.ogg') || lower.endsWith('.ogv')) return 'video/ogg';
  if (lower.endsWith('.m3u8')) return 'application/vnd.apple.mpegurl';
  return 'video/mp4';
}

function pickSource({ desktopUrl, mobileUrl }) {
  const isMobile = window.matchMedia('(max-width: 48em)').matches;
  if (isMobile && isDirectMediaUrl(mobileUrl)) return mobileUrl;
  if (isDirectMediaUrl(desktopUrl)) return desktopUrl;
  if (isDirectMediaUrl(mobileUrl)) return mobileUrl;
  return '';
}

function createVideoEl({ desktopUrl, mobileUrl, altText = '' }) {
  const video = document.createElement('video');
  video.className = 'hero-video';
  video.style.maxWidth = '100%';
  video.style.display = 'block';
  video.style.margin = '0 auto';
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  video.setAttribute('loop', '');
  video.setAttribute('preload', 'metadata');
  video.setAttribute('crossorigin', 'anonymous');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  if (!prefersReducedMotion.matches) {
    video.setAttribute('autoplay', '');
    video.autoplay = true;
  } else {
    video.removeAttribute('autoplay');
    video.autoplay = false;
    video.setAttribute('controls', '');
    video.controls = true;
  }
  if (altText) {
    video.setAttribute('aria-label', altText);
    video.setAttribute('title', altText);
  }

  const initialSrc = pickSource({ desktopUrl, mobileUrl });
  const sourceEl = document.createElement('source');
  sourceEl.src = initialSrc;
  sourceEl.type = mimeFromUrl(initialSrc);
  video.append(sourceEl);

  const safePlay = () => {
    const p = video.play?.();
    if (p && typeof p.then === 'function') p.catch(() => {});
  };

  const tryPlay = () => {
    if (!prefersReducedMotion.matches) safePlay();
  };

  video.addEventListener('loadeddata', tryPlay, { once: true });
  video.addEventListener('canplay', tryPlay, { once: true });
  video.addEventListener('canplaythrough', tryPlay, { once: true });

  const maybeSwap = () => {
    const desired = pickSource({ desktopUrl, mobileUrl });
    if (!desired || desired === sourceEl.src) return;
    const wasPaused = video.paused;
    video.pause();
    sourceEl.src = desired;
    sourceEl.type = mimeFromUrl(desired);
    video.load();
    if (!wasPaused && !prefersReducedMotion.matches) safePlay();
  };

  const mq = window.matchMedia('(max-width: 48em)');
  if (mq.addEventListener) mq.addEventListener('change', maybeSwap);
  else if (mq.addListener) mq.addListener(maybeSwap);
  window.addEventListener('orientationchange', maybeSwap);

  return video;
}

function extractFromRows(rows) {
  const urlRegex = /(https?:\/\/[^\s]+)/i;
  const values = { desktopUrl: '', mobileUrl: '', altText: '' };
  const urlRows = new Set();

  rows.forEach((row) => {
    const cells = Array.from(row.children);
    const cell = cells[0] || row;
    const a = cell.querySelector('a');
    const text = (cell.textContent || '').trim();

    if (a && a.href) {
      if (!values.desktopUrl) {
        values.desktopUrl = a.href.trim();
        urlRows.add(row);
        return;
      }
      if (!values.mobileUrl) {
        values.mobileUrl = a.href.trim();
        urlRows.add(row);
        return;
      }
    }

    const m = text.match(urlRegex);
    if (m) {
      if (!values.desktopUrl) {
        values.desktopUrl = m[1].trim();
        urlRows.add(row);
        return;
      }
      if (!values.mobileUrl) {
        values.mobileUrl = m[1].trim();
        urlRows.add(row);
        return;
      }
    }

    if (!m && !values.altText) {
      const lower = text.toLowerCase();
      if (lower.includes('alt') || lower.includes('description')) {
        const idx = text.indexOf(':');
        values.altText = idx >= 0 ? text.slice(idx + 1).trim() : (text || '').trim();
      }
    }
  });

  return { ...values, rowsToExclude: Array.from(urlRows) };
}

function buildOverlayFromRows(rows, rowsToExclude = []) {
  const overlay = document.createElement('div');
  overlay.className = 'cmp-text';
  const frag = document.createDocumentFragment();
  rows.forEach((row) => {
    if (!rowsToExclude.includes(row)) {
      frag.append(row.cloneNode(true));
    }
  });
  overlay.append(frag);
  return overlay;
}

export default async function decorate(block) {
  block.classList.add('hero');

  const originalRows = Array.from(block.children);
  const {
    desktopUrl, mobileUrl, altText, rowsToExclude,
  } = extractFromRows(originalRows);
  const overlay = buildOverlayFromRows(originalRows, rowsToExclude);

  block.textContent = '';
  block.dataset.embedLoaded = 'false';
  if (overlay.childNodes.length) block.append(overlay);

  const hasAnyDirect = isDirectMediaUrl(desktopUrl) || isDirectMediaUrl(mobileUrl);
  if (!hasAnyDirect) return;

  const player = document.createElement('div');
  player.className = 'hero-player';
  block.append(player);

  const start = () => {
    const video = createVideoEl({ desktopUrl, mobileUrl, altText });
    const wrapper = document.createElement('div');
    wrapper.className = 'hero-video-background';
    Object.assign(wrapper.style, {
      left: '0',
      width: '100%',
      height: '0',
      position: 'relative',
      paddingBottom: '56.25%',
    });
    Object.assign(video.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    });
    wrapper.appendChild(video);
    player.append(wrapper);

    const markLoaded = () => {
      block.dataset.embedLoaded = 'true';
      video.removeEventListener('loadeddata', markLoaded);
      video.removeEventListener('canplay', markLoaded);
      video.removeEventListener('canplaythrough', markLoaded);
    };
    video.addEventListener('loadeddata', markLoaded);
    video.addEventListener('canplay', markLoaded);
    video.addEventListener('canplaythrough', markLoaded);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        start();
      }
    },
    { rootMargin: '200px' },
  );
  observer.observe(block);
}
