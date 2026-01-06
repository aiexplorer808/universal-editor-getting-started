function getVideoSource(link) {
  if (link.includes('youtube') || link.includes('youtu.be')) return 'youtube';
  if (link.includes('vimeo')) return 'vimeo';
  return 'video';
}

function embedYoutube(url) {
  const usp = new URLSearchParams(url.search);
  const vid = usp.get('v') || url.pathname.split('/').pop();
  const temp = document.createElement('div');
  temp.innerHTML = `<div style="position:relative;padding-bottom:56.25%;height:0;">
      <iframe src="https://www.youtube.com/embed/${vid}?rel=0"
        style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"
        allow="autoplay; fullscreen; picture-in-picture"
        allowfullscreen title="YouTube video"></iframe>
    </div>`;
  return temp.firstChild;
}

function embedVimeo(url) {
  const vid = url.pathname.split('/').pop();
  const temp = document.createElement('div');
  temp.innerHTML = `<div style="position:relative;padding-bottom:56.25%;height:0;">
      <iframe src="https://player.vimeo.com/video/${vid}"
        style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"
        allow="autoplay; fullscreen; picture-in-picture"
        allowfullscreen title="Vimeo video"></iframe>
    </div>`;
  return temp.firstChild;
}

function getVideoElement(source) {
  const video = document.createElement('video');
  video.setAttribute('controls', '');
  video.style.width = '100%';
  const sourceEl = document.createElement('source');
  sourceEl.setAttribute('src', source);
  sourceEl.setAttribute('type', `video/${source.split('.').pop()}`);
  video.append(sourceEl);
  return video;
}

function loadVideoEmbed(block, link) {
  const url = new URL(link, window.location.href);
  const source = getVideoSource(link);
  let element;
  if (source === 'youtube') {
    element = embedYoutube(url);
  } else if (source === 'vimeo') {
    element = embedVimeo(url);
  } else {
    element = getVideoElement(link);
  }
  block.append(element);
}

export default function decorate(block) {
  const placeholder = block.querySelector('picture');
  const anchorEl = block.querySelector('a');
  const link = anchorEl ? anchorEl.href : '';
  block.textContent = '';

  if (placeholder) {
    const wrapper = document.createElement('div');
    wrapper.className = 'video-placeholder';
    wrapper.append(placeholder);
    wrapper.insertAdjacentHTML(
      'beforeend',
      '<button type="button" class="play-btn">Play</button>',
    );
    wrapper.querySelector('button').addEventListener('click', () => {
      wrapper.remove();
      loadVideoEmbed(block, link);
    });
    block.append(wrapper);
  } else {
    loadVideoEmbed(block, link);
  }
}
