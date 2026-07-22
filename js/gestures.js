const Gestures = (() => {
  const TAP_MAX_DISTANCE = 10;
  const SWIPE_THRESHOLD = 60;

  let startX = 0;
  let startY = 0;
  let tracking = false;

  function init(target, handlers) {
    target.addEventListener('touchstart', (e) => {
      if (e.target.closest('.home-btn') || e.target.closest('.chevron')) {
        tracking = false;
        return;
      }
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      tracking = true;
    }, { passive: true });

    target.addEventListener('touchend', (e) => {
      if (!tracking) return;
      tracking = false;

      const t = e.changedTouches[0];
      const deltaX = t.clientX - startX;
      const deltaY = t.clientY - startY;
      const distance = Math.hypot(deltaX, deltaY);

      if (distance < TAP_MAX_DISTANCE) {
        handlers.onTap();
        return;
      }

      const horizontal = Math.abs(deltaX) > Math.abs(deltaY);
      if (horizontal && Math.abs(deltaX) > SWIPE_THRESHOLD) {
        if (deltaX < 0) {
          handlers.onSwipeLeft();
        } else {
          handlers.onSwipeRight();
        }
      }
      // otherwise: ambiguous partial drag, do nothing
    }, { passive: true });
  }

  return { init };
})();
