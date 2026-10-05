(() => {
  const screen = document.querySelector('.site-loader');
  const meter = screen.querySelector('[role="progressbar"]');
  const percentage = screen.querySelector('.loading-percentage');
  const main = document.querySelector('main');
  main.inert = true;
  main.setAttribute('aria-busy', 'true');
  const tasks = [];
  const limit = (promise, ms = 60000) => new Promise(resolve => {
    const timer = setTimeout(resolve, ms);
    Promise.resolve(promise).catch(() => {}).finally(() => { clearTimeout(timer); resolve(); });
  });

  // Count the resources selected for this screen, not every responsive alternative.
  document.querySelectorAll('img').forEach(image => {
    image.loading = 'eager';
    tasks.push(() => limit(image.decode()));
  });
  for (const font of document.fonts) tasks.push(() => limit(font.load()));

  document.querySelectorAll('video.journey-video').forEach(video => {
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && !navigator.connection?.saveData && 'IntersectionObserver' in window) tasks.push(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 60000);
      try {
        const response = await fetch(video.dataset.src, { signal: controller.signal });
        if (!response.ok) throw new Error('Video unavailable');
        const blob = await response.blob();
        // Keep this page-lifetime URL so playback never downloads the loop again.
        video.dataset.src = URL.createObjectURL(blob);
      } catch { /* The original URL remains available for a later playback retry. */ }
      finally { clearTimeout(timer); }
    });
    tasks.push(() => limit(new Promise(resolve => {
      const poster = new Image();
      poster.onload = poster.onerror = resolve;
      poster.src = video.dataset.poster;
      video.poster = video.dataset.poster;
    })));
  });

  document.querySelectorAll('.live-player iframe[data-src]').forEach(player => {
    tasks.push(() => limit(new Promise(resolve => {
      player.addEventListener('load', resolve, { once: true });
      player.addEventListener('error', resolve, { once: true });
      player.loading = 'eager';
      player.src = player.dataset.src;
    }), 20000));
  });

  let completed = 0;
  const update = () => {
    const value = Math.floor(completed / tasks.length * 100);
    percentage.textContent = `${value}%`;
    meter.setAttribute('aria-valuenow', value);
    meter.style.setProperty('--progress', `${value}%`);
  };
  update();
  Promise.all(tasks.map(async task => {
    try { await task(); } catch { /* An unavailable resource must not trap the visitor. */ }
    completed++;
    update();
  })).then(() => {
    document.documentElement.classList.remove('is-loading');
    main.inert = false;
    main.removeAttribute('aria-busy');
    screen.remove();
    document.dispatchEvent(new Event('apokalis:ready'));
  });
})();
