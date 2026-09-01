// ux.js — minimal IntersectionObserver-based reveal system for styles-ux.css
// Observes elements with .reveal-on-scroll and .staggered-child and adds .in-view
// when they enter the viewport. One-time reveal by default (unobserve after in-view).

(() => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return; // do not run heavy motion for users who opt out

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;

      // If element is a staggered container, set a CSS variable delay on children
      if (el.classList.contains('staggered-child')) {
        Array.from(el.children).forEach((c, i) => {
          c.style.setProperty('--delay', `${i * 80}ms`);
        });
      }

      el.classList.add('in-view');

      // one-time reveal: stop observing
      obs.unobserve(el);
    });
  }, { threshold: 0.12 });

  // Observe current nodes and future nodes added to DOM
  const observeAll = () => {
    document.querySelectorAll('.reveal-on-scroll, .staggered-child').forEach(el => {
      // already revealed?
      if (!el.classList.contains('in-view')) observer.observe(el);
    });
  };

  // initial observe
  observeAll();

  // optional: observe DOM mutations to auto-observe newly added elements
  const mo = new MutationObserver((mutations) => {
    let added = false;
    for (const m of mutations) {
      if (m.addedNodes && m.addedNodes.length) { added = true; break; }
    }
    if (added) observeAll();
  });
  mo.observe(document.documentElement || document.body, { childList: true, subtree: true });
})();
