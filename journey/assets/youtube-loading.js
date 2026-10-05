(() => {
  const players = document.querySelectorAll('.live-player iframe[data-src]');
  const load = player => {
    if (player.hasAttribute('src')) return;
    // Begin loading ahead of the viewport; keep the loaded player alive afterward.
    player.loading = 'eager';
    player.src = player.dataset.src;
  };
  if (!('IntersectionObserver' in window)) {
    players.forEach(load);
    return;
  }
  const observer = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      load(target);
      observer.unobserve(target);
    }
  }, { rootMargin: '1200px 0px', threshold: 0 });
  players.forEach(player => observer.observe(player));
})();
