(() => {
  const videos = [...document.querySelectorAll('video.journey-video')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  const visible = new Set();
  const allowed = () => !reducedMotion.matches && !connection?.saveData;
  function update(video) {
    if (!allowed() || document.hidden || !visible.has(video)) {
      video.pause();
      if (!allowed() && video.hasAttribute('src')) {
        video.removeAttribute('src');
        video.load();
      }
      return;
    }
    if (!video.hasAttribute('src')) {
      video.src = video.dataset.src;
      video.load();
    }
    video.muted = true;
    video.play().catch(() => {});
  }
  // Without viewport observation, keep a static preview instead of loading every loop.
  if (!('IntersectionObserver' in window)) {
    videos.forEach(video => { if (video.dataset.poster) video.poster = video.dataset.poster; });
    return;
  }
  const observer = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (isIntersecting) {
        // Set the poster even when reduced motion or data saving disables playback.
        if (!target.hasAttribute('poster') && target.dataset.poster) {
          target.poster = target.dataset.poster;
        }
        visible.add(target);
      } else visible.delete(target);
      update(target);
    }
  }, { rootMargin: '100px 0px', threshold: 0 });
  videos.forEach(video => observer.observe(video));
  const refresh = () => videos.forEach(update);
  reducedMotion.addEventListener('change', refresh);
  connection?.addEventListener('change', refresh);
  document.addEventListener('visibilitychange', refresh);
})();
