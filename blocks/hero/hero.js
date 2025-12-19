export default function decorate(block) {
  const firstRow = block.querySelector(':scope > div:first-child');
  if (!firstRow) return;

  const DAM_BASE = 'https://author-p52710-e1559444.adobeaemcloud.com/content/dam/sample-wknd-app/en/image-files/';

  const explicitFileName =
    firstRow.dataset.videoFilename
    || firstRow.querySelector('a[href$=".mp4"]')?.textContent?.trim()
    || firstRow.querySelector('a[href$=".mp4"]')?.getAttribute('href')?.split('/').pop()
    || 'biker video.mp4';

  const explicitSrc = DAM_BASE + encodeURIComponent(explicitFileName);

  const video = document.createElement('video');
  video.src = explicitSrc;
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.className = 'hero-video';
  video.preload = 'metadata';

  firstRow.innerHTML = '';
  firstRow.append(video  firstRow.append(video);
