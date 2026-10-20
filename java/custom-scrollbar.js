(() => {
  'use strict';

  const finePointer = typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!finePointer) return;

  const ui = document.getElementById('ui');
  if (!ui) return;
  ui.classList.add('pt-custom-scrollbars');

  const style = document.createElement('style');
  style.textContent = `
    #pt-scrollbar-layer { position: fixed; inset: 0; z-index: 2147483000; pointer-events: none; }
    .pt-scrollbar-track {
      position: fixed; width: 12px; margin: 0; padding: 0;
      border-radius: 999px; background: transparent; opacity: 0;
      pointer-events: none; transition: opacity 140ms ease;
    }
    .pt-scrollbar-track.pt-visible { opacity: 1; }
    .pt-scrollbar-arrow {
      position: absolute; left: 0; width: 12px; height: 14px; padding: 0;
      border: 0; background: transparent; color: rgba(235,242,255,.92);
      font: 9px/14px Arial, sans-serif; text-align: center; text-shadow: 0 0 5px rgba(126,169,255,.8);
      opacity: .82; pointer-events: none; user-select: none;
      cursor: url("data/cursor/Arrow.cur"), auto !important;
    }
    .pt-scrollbar-arrow:hover { opacity: 1; color: #fff; text-shadow: 0 0 8px rgba(155,195,255,1); }
    .pt-scrollbar-arrow.pt-up { top: 0; }
    .pt-scrollbar-arrow.pt-down { bottom: 0; }
    .pt-scrollbar-thumb {
      position: absolute; top: 14px; left: 3px; width: 6px; min-height: 26px;
      border-radius: 999px; background: rgba(190, 205, 255, .78);
      border: 1px solid rgba(255,255,255,.62); box-sizing: border-box;
      box-shadow: 0 0 8px rgba(132,170,255,.52), inset 0 1px rgba(255,255,255,.5);
      pointer-events: none; touch-action: pan-y;
      cursor: url("data/cursor/Arrow.cur"), auto !important;
    }
    .pt-scrollbar-track.pt-visible .pt-scrollbar-thumb:hover {
      left: 2px; width: 8px; background: rgba(215,225,255,.96);
      box-shadow: 0 0 12px rgba(142,185,255,.8), inset 0 1px rgba(255,255,255,.75);
    }
    @media (hover: hover) and (pointer: fine) { .pt-scrollbar-thumb { pointer-events: auto; touch-action: none; } .pt-scrollbar-arrow { pointer-events: auto; } }
    @media (prefers-reduced-motion: reduce) { .pt-scrollbar-track { transition: none; } }
  `;
  document.head.appendChild(style);

  const layer = document.createElement('div');
  layer.id = 'pt-scrollbar-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);

  const entries = new Map();
  const scrollAnimations = new WeakMap();
  let pointerX = -1;
  let pointerY = -1;
  let frame = 0;

  function schedule() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      sync();
      updateAll();
    });
  }

  function isScrollable(el) {
    if (!(el instanceof HTMLElement) || el === ui || layer.contains(el)) return false;
    const s = getComputedStyle(el);
    return /^(auto|scroll|overlay)$/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 2;
  }

  function dispose(el, entry) {
    entry.track.remove();
    if (entry.resizeObserver) entry.resizeObserver.disconnect();
    el.removeEventListener('scroll', entry.onScroll);
    entries.delete(el);
  }

  function create(el) {
    const track = document.createElement('div');
    track.className = 'pt-scrollbar-track';
    const up = document.createElement('button');
    up.type = 'button';
    up.className = 'pt-scrollbar-arrow pt-up';
    up.setAttribute('aria-label', 'Scroll up');
    up.textContent = '▲';
    const thumb = document.createElement('div');
    thumb.className = 'pt-scrollbar-thumb';
    const down = document.createElement('button');
    down.type = 'button';
    down.className = 'pt-scrollbar-arrow pt-down';
    down.setAttribute('aria-label', 'Scroll down');
    down.textContent = '▼';
    track.append(up, thumb, down);
    layer.appendChild(track);

    const entry = { track, thumb, up, down, recent: 0, dragging: false, startY: 0, startTop: 0 };
    entry.onScroll = () => { entry.recent = performance.now() + 650; schedule(); };
    el.addEventListener('scroll', entry.onScroll, { passive: true });
    const arrowScroll = amount => event => {
      event.preventDefault();
      event.stopPropagation();
      smoothScrollBy(el, amount);
      entry.recent = performance.now() + 850;
      schedule();
    };
    up.addEventListener('click', arrowScroll(-40));
    down.addEventListener('click', arrowScroll(40));

    thumb.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      entry.dragging = true;
      entry.startY = event.clientY;
      entry.startTop = el.scrollTop;
      entry.recent = performance.now() + 1000;
      try { thumb.setPointerCapture(event.pointerId); } catch (_) {}
      schedule();
    });
    thumb.addEventListener('pointermove', event => {
      if (!entry.dragging) return;
      const range = el.scrollHeight - el.clientHeight;
      const trackRange = Math.max(1, entry.track.clientHeight - entry.thumb.offsetHeight);
      el.scrollTop = entry.startTop + (event.clientY - entry.startY) * range / trackRange;
      entry.recent = performance.now() + 650;
      schedule();
    });
    const stopDrag = () => { entry.dragging = false; schedule(); };
    thumb.addEventListener('pointerup', stopDrag);
    thumb.addEventListener('pointercancel', stopDrag);

    entry.resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    if (entry.resizeObserver) entry.resizeObserver.observe(el);
    entries.set(el, entry);
  }

  function smoothScrollBy(el, amount) {
    const previous = scrollAnimations.get(el);
    const start = el.scrollTop;
    const max = Math.max(0, el.scrollHeight - el.clientHeight);
    const target = Math.max(0, Math.min(max, (previous ? previous.target : start) + amount));
    if (previous) cancelAnimationFrame(previous.frame);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.scrollTop = target;
      scrollAnimations.delete(el);
      return;
    }
    const started = performance.now();
    const duration = 210;
    const state = { target, frame: 0 };
    const step = now => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.scrollTop = start + (target - start) * eased;
      schedule();
      if (progress < 1) state.frame = requestAnimationFrame(step);
      else scrollAnimations.delete(el);
    };
    scrollAnimations.set(el, state);
    state.frame = requestAnimationFrame(step);
  }

  function update(el, entry) {
    if (!el.isConnected || !isScrollable(el)) { dispose(el, entry); return; }
    const rect = el.getBoundingClientRect();
    const viewHeight = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
    if (rect.width <= 0 || viewHeight <= 0) { entry.track.classList.remove('pt-visible'); return; }

    const width = 12;
    const right = getComputedStyle(el).direction === 'rtl';
    entry.track.style.top = `${Math.max(0, rect.top)}px`;
    entry.track.style.height = `${viewHeight}px`;
    entry.track.style.left = `${right ? rect.left : rect.right - width}px`;
    const arrowSize = Math.min(14, viewHeight / 3);
    const thumbArea = Math.max(1, viewHeight - arrowSize * 2);
    const thumbHeight = Math.min(thumbArea, Math.max(26, viewHeight * el.clientHeight / el.scrollHeight));
    const thumbTravel = Math.max(0, thumbArea - thumbHeight);
    const scrollRange = Math.max(1, el.scrollHeight - el.clientHeight);
    entry.up.style.height = `${arrowSize}px`;
    entry.up.style.lineHeight = `${arrowSize}px`;
    entry.down.style.height = `${arrowSize}px`;
    entry.down.style.lineHeight = `${arrowSize}px`;
    entry.thumb.style.height = `${thumbHeight}px`;
    entry.thumb.style.top = `${arrowSize + thumbTravel * el.scrollTop / scrollRange}px`;

    const over = pointerX >= rect.left && pointerX <= rect.right && pointerY >= rect.top && pointerY <= rect.bottom;
    const visible = over || entry.dragging || performance.now() < entry.recent;
    entry.track.classList.toggle('pt-visible', visible);
  }

  function updateAll() {
    for (const [el, entry] of entries) update(el, entry);
  }

  function sync() {
    ui.querySelectorAll('*').forEach(el => {
      if (isScrollable(el) && !entries.has(el)) create(el);
    });
    for (const [el, entry] of entries) {
      if (!el.isConnected || !isScrollable(el)) dispose(el, entry);
    }
  }

  document.addEventListener('pointermove', event => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    schedule();
  }, { passive: true });
  document.addEventListener('pointerleave', () => { pointerX = pointerY = -1; schedule(); });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('scroll', schedule, { passive: true, capture: true });

  const mutationObserver = new MutationObserver(schedule);
  mutationObserver.observe(ui, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style'] });
  sync();
  updateAll();
})();
