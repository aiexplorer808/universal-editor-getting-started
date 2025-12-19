export default function decorate(block) {
  const firstRow = block.querySelector(':scope > div:first-child');
  console.log('firstRow?', !!firstRow);
  if (!firstRow) return;

  const videoLink = firstRow.querySelector('a[href$=".mp4"]');
  console.log('videoLink?', !!videoLink, 'href:', videoLink?.getAttribute('href'));
  if (!videoLink) return;

  const video = document.createElement('video');
  video.src = videoLink.href;
  console.log('video.src:', video.src);

  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.className = 'hero-video';

  firstRow.innerHTML = '';
  firstRow.append(video);
}
