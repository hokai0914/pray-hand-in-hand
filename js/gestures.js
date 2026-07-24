const Gestures = (() => {
  const TAP_MAX_DISTANCE = 10;
  const DRAG_START_THRESHOLD = 6;
  const DOUBLE_TAP_INTERVAL = 300; // ms
  const DOUBLE_TAP_MAX_DISTANCE = 40;

  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let lastTime = 0;
  let tracking = false;
  let dragging = false;

  let pinching = false;
  let pinchStartDistance = 0;

  let tapTimer = null;
  let lastTapTime = 0;
  let lastTapX = 0;
  let lastTapY = 0;

  function touchDistance(t1, t2) {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  }

  function touchMidpoint(t1, t2) {
    return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
  }

  function init(target, handlers) {
    target.addEventListener('touchstart', (e) => {
      if (e.target.closest('.home-btn') || e.target.closest('.chevron') || e.target.closest('.settings-btn') || e.target.closest('.settings-overlay')) {
        tracking = false;
        pinching = false;
        return;
      }

      if (e.touches.length === 2) {
        tracking = false;
        dragging = false;
        pinching = true;
        pinchStartDistance = touchDistance(e.touches[0], e.touches[1]);
        handlers.onPinchStart(touchMidpoint(e.touches[0], e.touches[1]));
        return;
      }

      if (e.touches.length === 1) {
        pinching = false;
        const t = e.touches[0];
        startX = lastX = t.clientX;
        startY = lastY = t.clientY;
        lastTime = e.timeStamp;
        tracking = true;
        dragging = false;
      }
    }, { passive: true });

    target.addEventListener('touchmove', (e) => {
      if (pinching) {
        if (e.touches.length !== 2) return;
        const dist = touchDistance(e.touches[0], e.touches[1]);
        handlers.onPinchMove(dist / pinchStartDistance, touchMidpoint(e.touches[0], e.touches[1]));
        return;
      }

      if (!tracking || e.touches.length !== 1) return;
      const t = e.touches[0];
      const deltaX = t.clientX - startX;
      const deltaY = t.clientY - startY;

      if (!dragging) {
        if (Math.abs(deltaX) < DRAG_START_THRESHOLD && Math.abs(deltaY) < DRAG_START_THRESHOLD) return;
        if (!handlers.isZoomed() && Math.abs(deltaY) > Math.abs(deltaX)) {
          // vertical gesture while not zoomed in - ignore, let the page behave normally
          tracking = false;
          return;
        }
        dragging = true;
        handlers.onDragStart();
      }

      lastX = t.clientX;
      lastY = t.clientY;
      lastTime = e.timeStamp;
      handlers.onDragMove(deltaX, deltaY);
    }, { passive: true });

    target.addEventListener('touchend', (e) => {
      if (pinching) {
        if (e.touches.length === 0) {
          pinching = false;
          handlers.onPinchEnd();
        }
        return;
      }

      if (!tracking) return;
      tracking = false;

      const t = e.changedTouches[0];
      const deltaX = t.clientX - startX;
      const deltaY = t.clientY - startY;

      if (!dragging) {
        const distance = Math.hypot(deltaX, deltaY);
        if (distance >= TAP_MAX_DISTANCE) return;

        const now = e.timeStamp;
        const sameSpot = Math.hypot(t.clientX - lastTapX, t.clientY - lastTapY) < DOUBLE_TAP_MAX_DISTANCE;
        if (tapTimer && now - lastTapTime < DOUBLE_TAP_INTERVAL && sameSpot) {
          clearTimeout(tapTimer);
          tapTimer = null;
          handlers.onDoubleTap({ x: t.clientX, y: t.clientY });
        } else {
          lastTapTime = now;
          lastTapX = t.clientX;
          lastTapY = t.clientY;
          tapTimer = setTimeout(() => {
            tapTimer = null;
            handlers.onTap();
          }, DOUBLE_TAP_INTERVAL);
        }
        return;
      }

      dragging = false;
      const dt = Math.max(e.timeStamp - lastTime, 1);
      const velocity = (t.clientX - lastX) / dt; // px/ms over the final movement
      handlers.onDragEnd(deltaX, deltaY, velocity);
    }, { passive: true });

    target.addEventListener('touchcancel', () => {
      tracking = false;
      pinching = false;
      if (dragging) {
        dragging = false;
        handlers.onDragEnd(0, 0, 0);
      }
    }, { passive: true });
  }

  return { init };
})();
