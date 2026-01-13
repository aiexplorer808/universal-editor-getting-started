const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function embedYoutube(url) {
  const usp = new URLSearchParams(url.search);
  let vid = usp.get('v') ? encodeURIComponent(usp.get('v')) : '';
  const embed = url.pathname;

  if (url.origin.includes('youtu.be')) {
    [, vid] = url.pathname.split('/');
  }

  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    playsinline: '1',
    controls: '0',
    modestbranding: '1',
    rel: '0',
    fs: '0',
    disablekb: '1',
    iv_load_policy: '3',
  });

  if (vid) {
    params.set('loop', '1');
    params.set('playlist', vid);
  }

  const src = `https://www.youtube.com${vid
    ? `/embed/${vid}?${params}`
    : `${embed}?${params}`}`;

  const wrapper = document.createElement('div');
  wrapper.className = 'hero-video-background';
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

  wrapper.appendChild(iframe);
  return wrapper;
}

function embedVimeo(url) {
  const [, video] = url.pathname.split('/');
  const params = new URLSearchParams({
    autoplay: '1',
    background: '1',
    playsinline: '1',
    muted: '1',
    loop: '1',
  });
  const src = `https://player.vimeo.com/video/${video}?${params}`;
  // eslint-disable-next-line no-console
  console.log(src);
  const wrapper = document.createElement('div');
  wrapper.style.left = '0';
  wrapper.style.width = '100%';
  wrapper.style.height = '0';
  wrapper.style.position = 'relative';
  wrapper.style.paddingBottom = '56.25%';
  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.style.border = '0';
  iframe.style.top = '0';
  iframe.style.left = '0';
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.position = 'absolute';
  iframe.frameBorder = '0';
  iframe.allow = 'autoplay; fullscreen; picture-in-picture';
  iframe.allowFullscreen = true;
  iframe.title = 'Content from Vimeo';
  iframe.loading = 'lazy';
  wrapper.appendChild(iframe);
  return wrapper;
}

function getVideoElement(source) {
  const video = document.createElement('video');
  video.style.maxWidth = '100%';
  video.style.display = 'block';
  video.style.margin = '0 auto';
  video.setAttribute('autoplay', '');
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('loop', '');
  video.setAttribute('preload', 'auto');
  const sourceEl = document.createElement('source');
  sourceEl.setAttribute('src', source);
  sourceEl.setAttribute('type', `video/${source.split('.').pop()}`);
  video.append(sourceEl);
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
    const videoEl = getVideoElement(url.href);
    block.append(videoEl);
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
  const player = document.createElement('div');
  player.className = 'hero-player';
  block.append(player);
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      if (!prefersReducedMotion.matches) {
        loadVideoEmbed(player, link);
      } else {
        loadVideoEmbed(player, link);
      }
    }
  });
  observer.observe(block);
}
