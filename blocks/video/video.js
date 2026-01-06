const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function getVideoSource(link) {
  if (link.includes('youtube') || link.includes('youtu.be')) return 'youtube';
  if (link.includes('vimeo')) return 'vimeo';
  return 'video';
}

function getVideoTypeLabel(source) {
  const labels = {
    youtube: 'YouTube video',
    vimeo: 'Vimeo video',
    video: 'MP4 video',
  };
  return labels[source] || 'video';
}

function embedYoutube(url, autoplay, background) {
  const usp = new URLSearchParams(url.search);
  let suffix = '';
  if (background || autoplay) {
    const suffixParams = {
      autoplay: autoplay ? '1' : '0',
      mute: background ? '1' : '0',
      controls: background ? '0' : '1',
      disablekb: background ? '1' : '0',
      loop: background ? '1' : '0',
      playsinline: background ? '1' : '0',
    };
    suffix = `&${Object.entries(suffixParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
  }
  let vid = usp.get('v') ? encodeURIComponent(usp.get('v')) : '';
  const embed = url.pathname;
  if (url.origin.includes('youtu.be')) {
    [, vid] = url.pathname.split('/');
  }

  const temp = document.createElement('div');
  temp.innerHTML = `<div style="left:0;width:100%;height:0;position:relative;padding-bottom:56.25%;">
      <iframe src="https://www.youtube.com${vid ? `/embed/${vid}?rel=0&v=${vid}${suffix}` : embed}"
        style="border:0;top:0;left:0;width:100%;height:100%;position:absolute;"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope"
        allowfullscreen="" scrolling="no" title="Content from YouTube" loading="lazy"></iframe>
    </div>`;
  return temp.children.item(0);
}

function embedVimeo(url, autoplay, background) {
  const [, video] = url.pathname.split('/');
  let suffix = '';
  if (background || autoplay) {
    const suffixParams = { autoplay: autoplay ? '1' : '0', background: background ? '1' : '0' };
    suffix = `?${Object.entries(suffixParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
  }
  const temp = document.createElement('div');
  temp.innerHTML = `<div style="left:0;width:100%;height:0;position:relative;padding-bottom:56.25%;">
      <iframe src="https://player.vimeo.com/video/${video}${suffix}"
        style="border:0;top:0;left:0;width:100%;height:100%;position:absolute;"
        frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen
        title="Content from Vimeo" loading="lazy"></iframe>
    </div>`;
  return temp.children.item(0);
}

function getVideoElement(source, autoplay, background) {
  const video = document.createElement('video');
  video.setAttribute('controls', '');
  if (autoplay) video.setAttribute('autoplay', '');
  if (background) {
    video.setAttribute('loop', '');
    video.setAttribute('playsinline', '');
    video.removeAttribute('controls');
    video.addEventListener('canplay', () => {
      video.muted = true;
      if (autoplay) video.play();
    });
  }
  const sourceEl = document.createElement('source');
  sourceEl.setAttribute('src', source);
  sourceEl.setAttribute('type', `video/${source.split('.').pop()}`);
  video.append(sourceEl);
  return video;
}

function normalizeLink(link) {
  try {
    return new URL(link, window.location.href).toString();
  } catch (e) {
    return link;
  }
}

/**
 * Dynamic import of React, ReactDOM and ReactPlayer from CDN (esm.sh)
 * so UE preview can render without a bundler.
 */
async function loadVideoEmbedReact(block, link, autoplay, background, posterUrl) {
  try {
    const [{ default: React }, { createRoot }, { default: ReactPlayer }] = await Promise.all([
      import('https://esm.sh/react@18.2.0'),
      import('https://esm.sh/react-dom@18.2.0/client'),
      import('https://esm.sh/react-player@2.14.0'),
    ]);

    const mount = document.createElement('div');
    mount.className = 'video-react-mount';
    mount.style.position = 'relative';
    mount.style.width = '100%';
    mount.style.height = '0';
    mount.style.paddingBottom = '56.25%';
    block.append(mount);

    const root = createRoot(mount);

    const playing = !!(autoplay && !prefersReducedMotion.matches);
    const isBackground = !!background;
    const controls = !isBackground;
    const url = normalizeLink(link);

    const player = React.createElement(ReactPlayer, {
      url,
      playing,
      muted: isBackground || autoplay,
      loop: isBackground,
      controls,
      playsinline: true,
      width: '100%',
      height: '100%',
      config: {
        file: { attributes: posterUrl ? { poster: posterUrl } : {} },
        youtube: {
          playerVars: {
            rel: 0,
            playsinline: 1,
            controls: controls ? 1 : 0,
            mute: (isBackground || autoplay) ? 1 : 0,
            modestbranding: 1,
            autoplay: playing ? 1 : 0,
            loop: isBackground ? 1 : 0,
          },
        },
        vimeo: {
          playerOptions: {
            autoplay: playing,
            muted: (isBackground || autoplay),
            background: isBackground,
            loop: isBackground,
          },
        },
      },
      onReady: () => { block.dataset.embedLoaded = 'true'; },
      onError: () => { block.dataset.embedLoaded = 'false'; },
    });

    const container = React.createElement('div', { style: { position: 'absolute', inset: 0 } }, player);
    root.render(container);
    return true;
  } catch (e) {
    return false;
  }
}

async function loadVideoEmbed(block, link, autoplay, background, posterUrl) {
  if (block.dataset.embedLoaded === 'true') return;

  const mounted = await loadVideoEmbedReact(block, link, autoplay, background, posterUrl);
  if (mounted) return;

  const url = new URL(link, window.location.href);
  const source = getVideoSource(url.toString());

  if (source === 'youtube') {
    const embedWrapper = embedYoutube(url, autoplay, background);
    block.append(embedWrapper);
    const iframe = embedWrapper.querySelector('iframe');
    if (iframe) {
      iframe.addEventListener('load', () => { block.dataset.embedLoaded = 'true'; });
    }
  } else if (source === 'vimeo') {
    const embedWrapper = embedVimeo(url, autoplay, background);
    block.append(embedWrapper);
    const iframe = embedWrapper.querySelector('iframe');
    if (iframe) {
      iframe.addEventListener('load', () => { block.dataset.embedLoaded = 'true'; });
    }
  } else {
    const videoEl = getVideoElement(url.toString(), autoplay, background);
    block.append(videoEl);
    videoEl.addEventListener('canplay', () => { block.dataset.embedLoaded = 'true'; });
  }
}

export default async function decorate(block) {
  const placeholder = block.querySelector('picture');
  const anchorEl = block.querySelector('a');

  const assetPath = block.dataset.assetPath || '';
  const videoUrl = block.dataset.videoUrl || '';
  const posterPath = block.dataset.posterPath || '';
  const link = (videoUrl || assetPath || (anchorEl ? anchorEl.href : '')).trim();

  block.textContent = '';
  block.dataset.embedLoaded = 'false';

  const autoplay = block.classList.contains('autoplay');
  const posterUrl = posterPath || '';

  if (placeholder) {
    block.classList.add('placeholder');
    const wrapper = document.createElement('div');
    wrapper.className = 'video-placeholder';
    wrapper.append(placeholder);

    if (!autoplay) {
      const source = getVideoSource(link);
      const videoType = getVideoTypeLabel(source);
      const ariaLabel = `Play ${videoType}`;

      wrapper.insertAdjacentHTML(
        'beforeend',
        `<div class="video-placeholder-play"><button type="button" title="${ariaLabel}" aria-label="${ariaLabel}"></button></div>`,
      );

      wrapper.addEventListener('click', () => {
        wrapper.remove();
        loadVideoEmbed(block, link, true, false, posterUrl);
      });
    }
    block.append(wrapper);
  }

  if (!placeholder || autoplay) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        const playOnLoad = autoplay && !prefersReducedMotion.matches;
        loadVideoEmbed(block, link, playOnLoad, autoplay, posterUrl);
      }
    });
    observer.observe(block);
  }
}
