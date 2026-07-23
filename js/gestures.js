const Gestures = (() => {
  const TAP_MAX_DISTANCE = 10;
  const DRAG_START_THRESHOLD = 6;

  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastTime = 0;
  let tracking = false;
  let dragging = false;

  function init(target, handlers) {
    target.addEventListener('touchstart', (e) => {
      if (e.target.closest('.home-btn') || e.target.closest('.chevron')) {
        tracking = false;
        return;
      }
      const t = e.touches[0];
      startX = lastX = t.clientX;
      startY = t.clientY;
      lastTime = e.timeStamp;
      tracking = true;
      dragging = false;
    }, { passive: true });

    target.addEventListener('touchmove', (e) => {
      if (!tracking) return;
      const t = e.touches[0];
      const deltaX = t.clientX - startX;
      const deltaY = t.clientY - startY;

      if (!dragging) {
        if (Math.abs(deltaX) < DRAG_START_THRESHOLD && Math.abs(deltaY) < DRAG_START_THRESHOLD) return;
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          // vertical gesture, let the page behave normally
          tracking = false;
          return;
        }
        dragging = true;
        handlers.onDragStart();
      }

      lastX = t.clientX;
      lastTime = e.timeStamp;
      handlers.onDragMove(deltaX);
    }, { passive: true });

    target.addEventListener('touchend', (e) => {
      if (!tracking) return;
      tracking = false;

      const t = e.changedTouches[0];
      const deltaX = t.clientX - startX;
      const deltaY = t.clientY - startY;

      if (!dragging) {
        const distance = Math.hypot(deltaX, deltaY);
        if (distance < TAP_MAX_DISTANCE) {
          handlers.onTap();
        }
        return;
      }

      dragging = false;
      const dt = Math.max(e.timeStamp - lastTime, 1);
      const velocity = (t.clientX - lastX) / dt; // px/ms over the final movement
      handlers.onDragEnd(deltaX, velocity);
    }, { passive: true });

    target.addEventListener('touchcancel', () => {
      tracking = false;
      if (dragging) {
        dragging = false;
        handlers.onDragEnd(0, 0);
      }
    }, { passive: true });
  }

  return { init };
})();
