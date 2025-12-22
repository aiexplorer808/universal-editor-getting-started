
function readConfigFromTable(block) {
  const table = block.querySelector('table');
  if (!table) return {};
  const config = {};
  [...table.rows].forEach((row) => {
    const key = (row.cells[0]?.textContent || '').trim();
    const val = (row.cells[1]?.textContent || '').trim();
    if (key) config[key] = val;
  });
  table.remove();
  return config;
}

function normalizeBoolean(val, fallback = false) {
  if (typeof val === 'boolean') return val;
  if (!val) return fallback;
  return ['true', 'yes', '1', 'on'].includes(String(val).toLowerCase());
}

function computeAspect(aspectRatio) {
  switch ((aspectRatio || '').trim()) {
    case '1:1': return 1;
    case '4:3': return 4 / 3;
    case '21:9': return 21 / 9;
    case '16:9':
    default: return 16 / 9;
  }
}

function isYouTube(url) {
  return /youtube\.com|youtu\.be/.test(url);
}
function isVimeo(url) {
  return /vimeo\.com/.test(url);
}
function isBrightcove(url) {
  return /brightcove|players\.brightcove\.net/.test(url);
}

function buildIframe(url, { autoplay, loop, controls }) {
  const params = new URLSearchParams();
  if (isYouTube(url)) {
    params.set('rel', '0');
    params.set('modestbranding', '1');
    params.set('playsinline', '1');
    params.set('controls', controls ? '1' : '0');
    if (autoplay) params.set('autoplay', '1');
    if (loop) params.set('loop', '1');
  } else if (isVimeo(url)) {
    params.set('byline', '0');
    params.set('portrait', '0');
    params.set('title', '0');
    params.set('controls', controls ? '1' : '0');
    if (autoplay) params.set('autoplay', '1');
    if (loop) params.set('loop', '1');
  } else if (isBrightcove(url)) {
    if (autoplay) params.set('autoplay', 'true');
    if (loop) params.set('loop', 'true');
    if (controls === false) params.set('controls', 'false');
  }
  const src = url.includes('?') ? `${url}&${params}` : `${url}?${params}`;
  const iframe = document.createElement('iframe');
  iframe.className = 'video__iframe';
  iframe.setAttribute('src', src);
  iframe.setAttribute('title', 'Video player');
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
  iframe.setAttribute('allowfullscreen', '');
  return iframe;
}

function buildNativeVideo({
  assetPath, posterPath, captionsPath, controls, autoplay, loop, muted, preload,
}) {
  const video = document.createElement('video');
  video.className = 'video__native';
  if (posterPath) video.setAttribute('poster', posterPath);
  video.setAttribute('playsinline', 'true');
  video.setAttribute('preload', preload || 'metadata');
  if (controls) video.setAttribute('controls', '');
  if (autoplay) video.setAttribute('autoplay', '');
  if (loop) video.setAttribute('loop', '');
  if (autoplay && !muted) muted = true;
  if (muted) video.muted = true;

  const source = document.createElement('source');
  source.setAttribute('src', assetPath);
  const ext = (assetPath.split('.').pop() || '').toLowerCase();
  const mime = ext === 'webm' ? 'video/webm' : ext === 'ogg' || ext === 'ogv' ? 'video/ogg' : 'video/mp4';
  source.setAttribute('type', mime);
  video.appendChild(source);

  if (captionsPath) {
    const track = document.createElement('track');
    track.setAttribute('kind', 'captions');
    track.setAttribute('srclang', 'en');
    track.setAttribute('label', 'English');
    track.setAttribute('src', captionsPath);
    video.appendChild(track);
  }
  return video;
}

export default async function decorate(block) {
  const cfg = {
    videoUrl: block.dataset.videoUrl,
    assetPath: block.dataset.assetPath,
    posterPath: block.dataset.posterPath,
    captionsPath: block.dataset.captionsPath,
    controls: normalizeBoolean(block.dataset.controls, true),
    autoplay: normalizeBoolean(block.dataset.autoplay, false),
    loop: normalizeBoolean(block.dataset.loop, false),
    muted: normalizeBoolean(block.dataset.muted, false),
    preload: block.dataset.preload || 'metadata',
    aspectRatio: block.dataset.aspectRatio || '16:9',
    ...readConfigFromTable(block),
  };

  const aspect = computeAspect(cfg.aspectRatio);

  const container = document.createElement('div');
  container.className = 'video__container';
  container.style.setProperty('--video-aspect', aspect);

  if (cfg.videoUrl && (isYouTube(cfg.videoUrl) || isVimeo(cfg.videoUrl) || isBrightcove(cfg.videoUrl))) {
    if (cfg.posterPath) {
      const posterWrap = document.createElement('div');
      posterWrap.className = 'video__poster';
      posterWrap.style.backgroundImage = `url("${cfg.posterPath}")`;

      const play = document.createElement('button');
      play.className = 'video__play';
      play.setAttribute('aria-label', 'Play video');
      play.innerHTML = '▶';
      posterWrap.appendChild(play);

      play.addEventListener('click', () => {
        const iframe = buildIframe(cfg.videoUrl, {
          autoplay: true, loop: cfg.loop, controls: cfg.controls,
        });
        container.replaceChildren(iframe);
      });

      container.appendChild(posterWrap);
    } else {
      const iframe = buildIframe(cfg.videoUrl, {
        autoplay: cfg.autoplay, loop: cfg.loop, controls: cfg.controls,
      });
      container.appendChild(iframe);
    }
  } else if (cfg.assetPath) {
    const video = buildNativeVideo(cfg);
    if (cfg.autoplay && cfg.posterPath) {
      const overlay = document.createElement('div');
      overlay.className = 'video__poster';
      overlay.style.backgroundImage = `url("${cfg.posterPath}")`;

      const play = document.createElement('button');
      play.className = 'video__play';
      play.setAttribute('aria-label', 'Play video');
      play.innerHTML = '▶';
      overlay.appendChild(play);

      play.addEventListener('click', () => {
        container.replaceChildren(video);
        video.play().catch(() => {});
      });

      container.appendChild(overlay);
    } else {
      container.appendChild(video);
    }
  } else {
    const warn = document.createElement('div');
    warn.className = 'video__error';
    warn.textContent = 'No video source provided. Please set either "videoUrl" or "assetPath".';
    container.appendChild(warn);
  }

  block.replaceChildren(container);
}
