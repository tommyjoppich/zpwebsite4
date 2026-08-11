document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme toggle ---------- */
  const themeBtn = document.querySelector('.dock-theme');
  const stored = localStorage.getItem('zp-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.setAttribute('data-theme', stored || (prefersDark ? 'dark' : 'light'));
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('zp-theme', next);
    });
  }

  /* ---------- Scroll progress ---------- */
  const progress = document.querySelector('.scroll-progress span');
  function updateProgress() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    if (progress) progress.style.width = pct + '%';
  }
  document.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ---------- Dock: sliding active indicator + scroll-spy ---------- */
  const dock = document.querySelector('.dock');
  const indicator = document.querySelector('.dock-indicator');
  const dockItems = document.querySelectorAll('.dock-item[data-target]');

  function moveIndicator(el) {
    if (!indicator || !dock || !el) return;
    const dockRect = dock.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    indicator.style.transform = `translateX(${elRect.left - dockRect.left - 7}px)`;
    indicator.style.width = elRect.width + 'px';
  }

  function setActive(id) {
    dockItems.forEach((item) => {
      const isActive = item.getAttribute('data-target') === id;
      item.classList.toggle('active', isActive);
      if (isActive) {
        moveIndicator(item);
        // re-measure after the label finishes expanding, but only if this
        // item is still the active one (guards against races during
        // fast smooth-scrolls that pass through several sections)
        setTimeout(() => {
          if (item.classList.contains('active')) moveIndicator(item);
        }, 370);
      }
    });
  }

  const sections = document.querySelectorAll('main section[id]');
  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: 0 }
    );
    sections.forEach((s) => spy.observe(s));
  }

  // initial position after fonts/layout settle
  window.addEventListener('load', () => {
    const active = document.querySelector('.dock-item.active');
    if (active) moveIndicator(active);
  });
  window.addEventListener('resize', () => {
    const active = document.querySelector('.dock-item.active');
    if (active) moveIndicator(active);
  });

  /* ---------- Hero cursor glow ---------- */
  const hero = document.querySelector('.hero');
  if (hero && !reduceMotion) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 120;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 80;
      hero.style.setProperty('--gx', x.toFixed(1) + 'px');
      hero.style.setProperty('--gy', y.toFixed(1) + 'px');
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const reveal = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => reveal.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in-view'));
  }

  /* ---------- Spotlight stat carousel ---------- */
  const stats = [
    { num: '2019', txt: 'The year ZeroPlus Derivatives was founded in Chicago.' },
    { num: '16', txt: 'US options exchanges we actively trade across.' },
    { num: '100%', txt: 'Self-funded — we trade our own capital, not outside money.' },
    { num: 'P + M', txt: 'Programmatic and manual execution, working together.' },
  ];
  const figureNum = document.querySelector('.spotlight-figure .num');
  const figureTxt = document.querySelector('.spotlight-figure .txt');
  const dotsWrap = document.querySelector('.spotlight-dots');
  let statIndex = 0;
  let statTimer;

  function renderStat(i) {
    statIndex = i;
    if (figureNum) figureNum.textContent = stats[i].num;
    if (figureTxt) figureTxt.textContent = stats[i].txt;
    if (dotsWrap) {
      dotsWrap.querySelectorAll('button').forEach((b, bi) => b.classList.toggle('active', bi === i));
    }
  }
  function nextStat() { renderStat((statIndex + 1) % stats.length); }
  function startAutoplay() {
    if (reduceMotion) return;
    stopAutoplay();
    statTimer = setInterval(nextStat, 3800);
  }
  function stopAutoplay() { if (statTimer) clearInterval(statTimer); }

  if (dotsWrap) {
    stats.forEach((s, i) => {
      const b = document.createElement('button');
      if (i === 0) b.classList.add('active');
      b.setAttribute('aria-label', 'Show stat ' + (i + 1));
      b.addEventListener('click', () => { renderStat(i); startAutoplay(); });
      dotsWrap.appendChild(b);
    });
    renderStat(0);
    const spotlight = document.querySelector('.spotlight');
    if (spotlight) {
      spotlight.addEventListener('mouseenter', stopAutoplay);
      spotlight.addEventListener('mouseleave', startAutoplay);
    }
    startAutoplay();
  }

  /* ---------- Accordion ---------- */
  document.querySelectorAll('.acc-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.acc-item');
      const panel = item.querySelector('.acc-panel');
      const wasOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.acc-item.open').forEach((openItem) => {
        openItem.classList.remove('open');
        openItem.querySelector('.acc-panel').style.maxHeight = null;
      });
      if (!wasOpen) {
        item.classList.add('open');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });
  // open first accordion item by default
  const firstAcc = document.querySelector('.acc-item');
  if (firstAcc) {
    firstAcc.classList.add('open');
    const p = firstAcc.querySelector('.acc-panel');
    if (p) p.style.maxHeight = p.scrollHeight + 'px';
  }

  /* ---------- Team tabs ---------- */
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      tabBtns.forEach((b) => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.tab-panel').forEach((panel) => {
        panel.classList.toggle('active', panel.getAttribute('data-panel') === target);
      });
    });
  });

  /* ---------- Copy email ---------- */
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy');
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) { /* clipboard unavailable, ignore */ }
      btn.classList.add('is-copied');
      setTimeout(() => btn.classList.remove('is-copied'), 1600);
    });
  });

  /* ---------- Mobile dock: same dock, just icon-only via CSS ---------- */
});
