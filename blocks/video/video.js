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

function embedYoutube(url) {
  const usp = new URLSearchParams(url.search);
  let vid = usp.get('v');
  if (!vid) {
    const parts = url.pathname.split('/').filter(Boolean);
    vid = parts.pop();
  }
  if (!vid) return null;

  const wrapper = createAspectWrapper();
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(vid)}?rel=0`;
  iframe.style.border = '0';
  iframe.style.position = 'absolute';
  iframe.style.top = '0';
  iframe.style.left = '0';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.setAttribute('allow', 'fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope');
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('title', 'YouTube video');
  iframe.setAttribute('loading', 'lazy');
  wrapper.appendChild(iframe);
  return wrapper;
}

function embedVimeo(url) {
  const parts = url.pathname.split('/').filter(Boolean);
  const vid = parts.pop();
  if (!vid) return null;

  const wrapper = createAspectWrapper();
  const iframe = document.createElement('iframe');
  iframe.src = `https://player.vimeo.com/video/${encodeURIComponent(vid)}`;
  iframe.style.border = '0';
  iframe.style.position = 'absolute';
  iframe.style.top = '0';
  iframe.style.left = '0';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.setAttribute('allow', 'fullscreen; picture-in-picture');
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('title', 'Vimeo video');
  iframe.setAttribute('loading', 'lazy');
  wrapper.appendChild(iframe);
  return wrapper;
}

function getVideoElement(sourceUrl) {
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
  return wrapper;
}

function loadVideoEmbed(block, link) {
  if (!link) return;
  const url = new URL(link, window.location.href);
  const srcType = getVideoSource(link);

  let element = null;
  if (srcType === 'youtube') element = embedYoutube(url);
  else if (srcType === 'vimeo') element = embedVimeo(url);
  else element = getVideoElement(link);

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
    btn.textContent = 'Play';
    btn.setAttribute('aria-label', 'Play video');
    btn.style.position = 'absolute';
    btn.style.left = '50%';
    btn.style.top = '50%';
    btn.style.transform = 'translate(-50%, -50%)';

    ph.style.position = 'relative';
    ph.style.paddingBottom = '56.25%';
    ph.style.height = '0';

    if (img) {
      img.style.position = 'absolute';
      img.style.inset = '0';
    }

    ph.appendChild(btn);
    btn.addEventListener('click', () => {
      ph.remove();
      loadVideoEmbed(block, link);
    });

    block.appendChild(ph);
  } else {
    loadVideoEmbed(block, link);
  }
}
