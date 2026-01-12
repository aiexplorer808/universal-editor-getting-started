// eslint-disable-next-line no-unused-vars
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function embedYoutube(url) {
  const usp = new URLSearchParams(url.search);
  let vid = usp.get('v') ? encodeURIComponent(usp.get('v')) : '';
  const embed = url.pathname;
  if (url.origin.includes('youtu.be')) {
    [, vid] = url.pathname.split('/');
  }
  const params = new URLSearchParams({
    rel: '0',
    v: vid || '',
    autoplay: '1',
    playsinline: '1',
    mute: '1',
  });
  const src = `https://www.youtube.com${vid ? `/embed/${vid}?${params}` : `${embed}?${params}`}`;

  // structural wrapper to match live site's naming
  const wrapper = document.createElement('div');
  wrapper.className = 'hero-video-background'; // <<< important
  Object.assign(wrapper.style, {
    left: '0',
    width: '100%',
    height: '0',
    position: 'relative',
    paddingBottom: '56.25%',
  });

  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.style.border = '0';
  iframe.style.top = '0';
  iframe.style.left = '0';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.position = 'absolute';
  iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope';
  iframe.allowFullscreen = true;
  iframe.scrolling = 'no';
  iframe.title = 'Content from YouTube';
  // for true hero autoplay, avoid lazy to reduce race conditions
  // iframe.loading = 'lazy'; // optional: comment out for autoplay reliability

  wrapper.appendChild(iframe);
  return wrapper;
}

function embedVimeo(url) {
  const [, video] = url.pathname.split('/');
  const params = new URLSearchParams({
    autoplay: '1',
    playsinline: '1',
    muted: '1',
    loop: '1',
  });
  const src = `https://player.vimeo.com/video/${video}?${params}`;

  const wrapper = document.createElement('div');
  wrapper.className = 'hero-video-background'; // <<< important
  Object.assign(wrapper.style, {
    left: '0',
    width: '100%',
    height: '0',
    position: 'relative',
    paddingBottom: '56.25%',
  });

  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.style.border = '0';
  iframe.style.top = '0';
  iframe.style.left = '0';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.position = 'absolute';
  iframe.setAttribute('frameBorder', '0');
  iframe.allow = 'autoplay; fullscreen; picture-in-picture';
  iframe.allowFullscreen = true;
  iframe.title = 'Content from Vimeo';
  // iframe.loading = 'lazy'; // optional

  wrapper.appendChild(iframe);
  return wrapper;
}

function getVideoElement(source) {
  const video = document.createElement('video');

  // match live site's class naming & visibility behavior
  video.className = 'hero__video-background hero__video-background--desktop d-none d-md-block';

  // keep your autoplay-related attributes
  video.setAttribute('controls', '');
  video.setAttribute('autoplay', '');
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('loop', '');
  video.setAttribute('preload', 'auto');

  // styling equivalent to your CSS but inline for safety
  video.style.maxWidth = '100%';
  video.style.display = 'block';
  video.style.margin = '0 auto';
  video.style.aspectRatio = '16 / 9';
  video.style.border = 'none';

  const sourceEl = document.createElement('source');
  sourceEl.setAttribute('src', source);
  sourceEl.setAttribute('type', `video/${source.split('.').pop()}`);
  video.append(sourceEl);

  // programmatic play to reinforce autoplay
  video.addEventListener('canplay', () => {
    const playPromise = video.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch(() => {});
    }
  });

  return video;
}

const loadVideoEmbed = (block, link) => {
  if (block.dataset.embedLoaded === 'true') return;
  let url;
  try {
    url = new URL(link, window.location.origin);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Hero block: Invalid video URL', link);
    return;
  }

  const isYoutube = /youtube\.com|youtu\.be/.test(url.href);
  const isVimeo = /vimeo\.com/.test(url.href);

  if (isYoutube) {
    const embedWrapper = embedYoutube(url);
    block.append(embedWrapper);
    embedWrapper.querySelector('iframe').addEventListener('load', () => {
      block.dataset.embedLoaded = 'true';
    });
  } else if (isVimeo) {
    const embedWrapper = embedVimeo(url);
    block.append(embedWrapper);
    embedWrapper.querySelector('iframe').addEventListener('load', () => {
      block.dataset.embedLoaded = 'true';
    });
  } else {
    // HTML5 source video (mp4, webm, etc.)
    const wrapper = document.createElement('div');
    wrapper.className = 'hero-video-background'; // <<< match live
    block.append(wrapper);

    const videoEl = getVideoElement(url.href);
    wrapper.append(videoEl);

    videoEl.addEventListener('canplay', () => {
      block.dataset.embedLoaded = 'true';
    });
  }
};

export default async function decorate(block) {
  const rows = [...block.children];
  let link = '';

  rows.forEach((row) => {
    const cells = [...row.children];
    if (cells.length === 0) return;
    const cell = cells[0];
    const cellText = cell.textContent.trim();
    const a = cell.querySelector('a');
    if (a && a.href) {
      link = a.href;
    } else if (
      cellText
      && (cellText.startsWith('http://')
      || cellText.startsWith('https://')
      || cellText.startsWith('/'))
    ) {
      link = cellText;
    }
  });

  if (!link) {
    const a = block.querySelector('a');
    if (a) link = a.href;
  }

  if (!link) {
    // eslint-disable-next-line no-console
    console.warn('Hero block: No video URL found');
    return;
  }

  block.textContent = '';
  block.dataset.embedLoaded = 'false';

  // outer container with expected classes
  block.classList.add('hero', 'hero--video_background', 'position-relative', 'overflow-hidden');

  const player = document.createElement('div');
  player.className = 'hero-player';
  block.append(player);

  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      // If you really want reduced motion to stop autoplay, gate it here
      // For parity with your current behavior, both branches load:
      loadVideoEmbed(player, link);
    }
  });
  observer.observe(block);
}
