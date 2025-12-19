export default function decorate(block) {
  const firstRow = block.querySelector(':scope > div:first-child');
  if (!firstRow) return;

  const videoLink = firstRow.querySelector('a[href$=".mp4"]');
  if (!videoLink) return;

  const video = document.createElement('video');
  video.src = videoLink.href;
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.className = 'hero-video';

  firstRow.innerHTML = '';
  firstRow.append(video);
}