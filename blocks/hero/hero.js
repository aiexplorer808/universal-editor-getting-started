.hero-container .hero-wrapper {
  max-width: unset;
  padding: 0;
}

.hero {
  position: relative;
  min-height: 70vh;
  padding: 40px 24px;
  display: flex;
  align-items: center;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 1200px;
  margin: 0 auto;
  color: var(--background-color);
}

.hero h1,
.hero p {
  color: #fff;
}

/* Video background */
.hero-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}

/* Image fallback */
.hero picture {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Optional overlay for readability */
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 1;
}

@media (width >= 900px) {
  .hero {
    padding: 64px;
  }
}
