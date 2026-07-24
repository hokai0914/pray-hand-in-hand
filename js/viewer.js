const Viewer = (() => {
  const EDGE_RESISTANCE = 0.35;
  const SWIPE_DISTANCE_RATIO = 0.2;
  const SWIPE_VELOCITY = 0.55; // px/ms

  const MIN_ZOOM = 1;
  const MAX_ZOOM = 3.5;
  const DOUBLE_TAP_ZOOM = 2.4;

  let sequence = [];
  let currentIndex = 0;
  let overlayVisible = false;
  let hintPlayed = false;
  let animating = false;
  let currentOffsetPx = 0;
  let tapHintTimer = null;

  let zoomScale = 1;
  let panX = 0;
  let panY = 0;
  let pinchStartScale = 1;
  let panStartX = 0;
  let panStartY = 0;

  const el = {
    viewer: null,
    backdrop: null,
    nameLabel: null,
    track: null,
    photoPrev: null,
    photoCurrent: null,
    photoNext: null,
    prayerText: null,
    chevronLeft: null,
    chevronRight: null,
    dots: null,
    tapHint: null,
  };

  function init() {
    el.viewer = Utils.qs('#viewer');
    el.backdrop = Utils.qs('#viewer-backdrop');
    el.nameLabel = Utils.qs('#name-label');
    el.track = Utils.qs('#carousel-track');
    el.photoPrev = Utils.qs('#photo-prev');
    el.photoCurrent = Utils.qs('#photo-current');
    el.photoNext = Utils.qs('#photo-next');
    el.prayerText = Utils.qs('#prayer-text');
    el.chevronLeft = Utils.qs('#chevron-left');
    el.chevronRight = Utils.qs('#chevron-right');
    el.dots = Utils.qs('#progress-dots');
    el.tapHint = Utils.qs('#tap-hint');
  }

  function start(children) {
    sequence = children;
    currentIndex = 0;
    overlayVisible = false;
    hintPlayed = false;
    animating = false;
    el.viewer.classList.remove('overlay-visible');
    el.track.classList.remove('settling');
    hideTapHint();
    setTrackOffset(0);
    setZoomTransition(false);
    resetZoom();
    renderDots();
    render({ playHint: true });
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function isZoomed() {
    return zoomScale > MIN_ZOOM + 0.01;
  }

  function setZoomTransition(enabled) {
    el.photoCurrent.classList.toggle('zoom-transition', enabled);
  }

  function applyZoomTransform() {
    el.photoCurrent.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
  }

  function clampPan() {
    if (zoomScale <= MIN_ZOOM) {
      panX = 0;
      panY = 0;
      return;
    }
    const maxOffsetX = (el.photoCurrent.clientWidth * (zoomScale - 1)) / 2;
    const maxOffsetY = (el.photoCurrent.clientHeight * (zoomScale - 1)) / 2;
    panX = clamp(panX, -maxOffsetX, maxOffsetX);
    panY = clamp(panY, -maxOffsetY, maxOffsetY);
  }

  function resetZoom() {
    zoomScale = MIN_ZOOM;
    panX = 0;
    panY = 0;
    applyZoomTransform();
  }

  function setTrackOffset(px) {
    currentOffsetPx = px;
    el.track.style.transform = `translateX(calc(-100% / 3 + ${px}px))`;
  }

  function setSlideImage(img, child) {
    if (!child) {
      img.removeAttribute('src');
      img.alt = '';
      return;
    }
    img.src = Utils.buildImageUrl(child.image);
    img.alt = child.name;
  }

  function render({ playHint } = {}) {
    const child = sequence[currentIndex];
    if (!child) return;

    setSlideImage(el.photoPrev, sequence[currentIndex - 1]);
    setSlideImage(el.photoCurrent, child);
    setSlideImage(el.photoNext, sequence[currentIndex + 1]);

    const url = Utils.buildImageUrl(child.image);
    el.backdrop.style.backgroundImage = `url("${url}")`;
    el.nameLabel.textContent = `${child.grade}학년 ${child.name}`;
    el.prayerText.textContent = child.prayer;

    el.chevronLeft.classList.toggle('hidden', currentIndex === 0);
    el.chevronRight.classList.toggle('hidden', currentIndex === sequence.length - 1);

    updateDots();

    if (playHint && !hintPlayed) {
      hintPlayed = true;
      requestAnimationFrame(() => {
        el.photoCurrent.classList.add('swipe-hint');
        el.chevronLeft.classList.add('pulse');
        el.chevronRight.classList.add('pulse');
        setTimeout(() => {
          el.photoCurrent.classList.remove('swipe-hint');
          el.chevronLeft.classList.remove('pulse');
          el.chevronRight.classList.remove('pulse');
        }, 700);
      });
      showTapHint();
    }
  }

  function showTapHint() {
    el.tapHint.classList.add('visible');
    clearTimeout(tapHintTimer);
    tapHintTimer = setTimeout(hideTapHint, 2600);
  }

  function hideTapHint() {
    clearTimeout(tapHintTimer);
    tapHintTimer = null;
    el.tapHint.classList.remove('visible');
  }

  function renderDots() {
    el.dots.innerHTML = '';
    if (sequence.length > 12) return; // too many dots would be noisy
    sequence.forEach(() => {
      const dot = document.createElement('span');
      dot.className = 'dot';
      el.dots.appendChild(dot);
    });
  }

  function updateDots() {
    const dots = el.dots.children;
    for (let i = 0; i < dots.length; i++) {
      dots[i].classList.toggle('current', i === currentIndex);
    }
  }

  function settleTo(px, onDone) {
    if (Math.abs(px - currentOffsetPx) < 0.5) {
      el.track.classList.remove('settling');
      onDone();
      return;
    }

    animating = true;
    el.track.classList.add('settling');

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el.track.removeEventListener('transitionend', handleEnd);
      clearTimeout(fallback);
      el.track.classList.remove('settling');
      animating = false;
      onDone();
    };

    const handleEnd = (e) => {
      if (e.target !== el.track || e.propertyName !== 'transform') return;
      finish();
    };

    el.track.addEventListener('transitionend', handleEnd);
    const fallback = setTimeout(finish, 400);

    requestAnimationFrame(() => setTrackOffset(px));
  }

  function goTo(direction) {
    if (animating) return;
    if (isZoomed()) {
      setZoomTransition(true);
      resetZoom();
      return;
    }
    if (direction > 0 && currentIndex >= sequence.length - 1) return;
    if (direction < 0 && currentIndex <= 0) return;

    const viewerWidth = el.viewer.clientWidth || 1;
    settleTo(-direction * viewerWidth, () => {
      currentIndex += direction;
      resetZoom();
      setTrackOffset(0);
      render({});
    });
  }

  function onDragStart() {
    if (animating) return;
    if (isZoomed()) {
      panStartX = panX;
      panStartY = panY;
      setZoomTransition(false);
      return;
    }
    el.track.classList.remove('settling');
  }

  function onDragMove(deltaX, deltaY) {
    if (animating) return;
    if (isZoomed()) {
      panX = panStartX + deltaX;
      panY = panStartY + deltaY;
      clampPan();
      applyZoomTransform();
      return;
    }
    let dx = deltaX;
    const atFirst = currentIndex === 0;
    const atLast = currentIndex === sequence.length - 1;
    if ((dx > 0 && atFirst) || (dx < 0 && atLast)) {
      dx *= EDGE_RESISTANCE;
    }
    setTrackOffset(dx);
  }

  function onDragEnd(deltaX, deltaY, velocity) {
    if (animating) return;
    if (isZoomed()) return;

    const viewerWidth = el.viewer.clientWidth || 1;
    const atFirst = currentIndex === 0;
    const atLast = currentIndex === sequence.length - 1;

    let dx = deltaX;
    if ((dx > 0 && atFirst) || (dx < 0 && atLast)) {
      dx *= EDGE_RESISTANCE;
    }

    const passedDistance = Math.abs(dx) > viewerWidth * SWIPE_DISTANCE_RATIO;
    const passedVelocity = Math.abs(velocity) > SWIPE_VELOCITY;
    const wantsNext = dx < 0 && (passedDistance || passedVelocity) && !atLast;
    const wantsPrev = dx > 0 && (passedDistance || passedVelocity) && !atFirst;

    if (wantsNext) {
      goTo(1);
      return;
    }
    if (wantsPrev) {
      goTo(-1);
      return;
    }
    settleTo(0, () => {});
  }

  function onPinchStart() {
    pinchStartScale = zoomScale;
    setZoomTransition(false);
  }

  function onPinchMove(ratio) {
    zoomScale = clamp(pinchStartScale * ratio, MIN_ZOOM, MAX_ZOOM);
    clampPan();
    applyZoomTransform();
  }

  function onPinchEnd() {
    if (zoomScale < MIN_ZOOM + 0.05) {
      setZoomTransition(true);
      resetZoom();
    }
  }

  function onDoubleTap() {
    setZoomTransition(true);
    if (isZoomed()) {
      resetZoom();
    } else {
      zoomScale = DOUBLE_TAP_ZOOM;
      panX = 0;
      panY = 0;
      applyZoomTransform();
    }
  }

  function next() {
    goTo(1);
  }

  function prev() {
    goTo(-1);
  }

  function toggleOverlay() {
    hideTapHint();
    overlayVisible = !overlayVisible;
    el.viewer.classList.toggle('overlay-visible', overlayVisible);
  }

  return {
    init,
    start,
    next,
    prev,
    toggleOverlay,
    isZoomed,
    onDragStart,
    onDragMove,
    onDragEnd,
    onPinchStart,
    onPinchMove,
    onPinchEnd,
    onDoubleTap,
  };
})();
