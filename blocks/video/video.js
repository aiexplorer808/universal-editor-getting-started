function getVideoSource(link) {
  const l = link.toLowerCase();
  if (l.includes('youtube') || l.includes('youtu.be')) return 'youtube';
  if (l.includes('vimeo')) return 'vimeo';
  return 'video';
}

function createAspectWrapper() {
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  wrapper.style.paddingBottom = '56.25%';
  wrapper.style.height = '0';
  wrapper.style.left = '0';
  wrapper.style.width = '100%';
  return wrapper;
}

function embedYoutube(url, opts = {}) {
  const usp = new URLSearchParams(url.search);
  let vid = usp.get('v');
  if (!vid) {
    const parts = url.pathname.split('/').filter(Boolean);
    vid = parts.pop();
  }
  if (!vid) return null;

  const wrapper = createAspectWrapper();
  const iframe = document.createElement('iframe');

  const params = new URLSearchParams();
  params.set('rel', '0');
  if (opts.autoplay) params.set('autoplay', '1');
  params.set('playsinline', '1');

  iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(vid)}?${params.toString()}`;
  iframe.style.border = '0';
  iframe.style.position = 'absolute';
  iframe.style.top = '0';
  iframe.style.left = '0';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope');
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('title', 'YouTube video');
  iframe.setAttribute('loading', 'lazy');
  wrapper.appendChild(iframe);
  return wrapper;
}

function embedVimeo(url, opts = {}) {
  const parts = url.pathname.split('/').filter(Boolean);
  const vid = parts.pop();
  if (!vid) return null;

  const wrapper = createAspectWrapper();
  const iframe = document.createElement('iframe');

  const params = new URLSearchParams();
  if (opts.autoplay) params.set('autoplay', '1');

  const qs = params.toString();
  iframe.src = `https://player.vimeo.com/video/${encodeURIComponent(vid)}${qs ? `?${qs}` : ''}`;
  iframe.style.border = '0';
  iframe.style.position = 'absolute';
  iframe.style.top = '0';
  iframe.style.left = '0';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('title', 'Vimeo video');
  iframe.setAttribute('loading', 'lazy');
  wrapper.appendChild(iframe);
  return wrapper;
}

function getVideoElement(sourceUrl, opts = {}) {
  const wrapper = createAspectWrapper();
  const video = document.createElement('video');
  video.setAttribute('controls', '');
  video.style.position = 'absolute';
  video.style.top = '0';
  video.style.left = '0';
  video.style.width = '100%';
  video.style.height = '100%';

  const sourceEl = document.createElement('source');
  sourceEl.src = sourceUrl;
  const ext = sourceUrl.split('.').pop()?.toLowerCase() || 'mp4';
  sourceEl.type = `video/${ext}`;
  video.appendChild(sourceEl);

  wrapper.appendChild(video);

  if (opts.autoplay) {
    const tryPlay = () => {
      const p = video.play?.();
      if (p && typeof p.then === 'function') {
        p.catch(() => {});
      }
    };
    video.addEventListener('canplay', tryPlay, { once: true });
  }

  return wrapper;
}

function loadVideoEmbed(block, link, opts = {}) {
  if (!link) return;
  const url = new URL(link, window.location.href);
  const srcType = getVideoSource(link);

  let element = null;
  if (srcType === 'youtube') element = embedYoutube(url, opts);
  else if (srcType === 'vimeo') element = embedVimeo(url, opts);
  else element = getVideoElement(link, opts);

  if (element) {
    block.textContent = '';
    block.appendChild(element);
  }
}

export default function decorate(block) {
  const placeholderPicture = block.querySelector('picture');
  const anchorEl = block.querySelector('a');
  const link = anchorEl ? anchorEl.href : '';

  block.textContent = '';

  if (placeholderPicture) {
    const ph = document.createElement('div');
    ph.className = 'video-placeholder';

    const img = placeholderPicture.querySelector('img') || document.createElement('img');
    if (img) {
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      ph.appendChild(img);
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'play-btn';
    btn.setAttribute('aria-label', 'Play video');

    ph.appendChild(btn);
    btn.addEventListener('click', () => {
      ph.remove();
      loadVideoEmbed(block, link, { autoplay: true });
    });

    block.appendChild(ph);
  } else {
    loadVideoEmbed(block, link);
  }
}
