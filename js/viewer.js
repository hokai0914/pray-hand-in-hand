const Viewer = (() => {
  const EDGE_RESISTANCE = 0.35;
  const SWIPE_DISTANCE_RATIO = 0.2;
  const SWIPE_VELOCITY = 0.55; // px/ms

  let sequence = [];
  let currentIndex = 0;
  let overlayVisible = false;
  let hintPlayed = false;
  let animating = false;
  let currentOffsetPx = 0;

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
  }

  function start(children) {
    sequence = children;
    currentIndex = 0;
    overlayVisible = false;
    hintPlayed = false;
    animating = false;
    el.viewer.classList.remove('overlay-visible');
    el.track.classList.remove('settling');
    setTrackOffset(0);
    renderDots();
    render({ playHint: true });
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
    el.nameLabel.textContent = child.name;
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
    }
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
    if (direction > 0 && currentIndex >= sequence.length - 1) return;
    if (direction < 0 && currentIndex <= 0) return;

    const viewerWidth = el.viewer.clientWidth || 1;
    settleTo(-direction * viewerWidth, () => {
      currentIndex += direction;
      closeOverlay();
      setTrackOffset(0);
      render({});
    });
  }

  function onDragStart() {
    if (animating) return;
    el.track.classList.remove('settling');
  }

  function onDragMove(deltaX) {
    if (animating) return;
    let dx = deltaX;
    const atFirst = currentIndex === 0;
    const atLast = currentIndex === sequence.length - 1;
    if ((dx > 0 && atFirst) || (dx < 0 && atLast)) {
      dx *= EDGE_RESISTANCE;
    }
    setTrackOffset(dx);
  }

  function onDragEnd(deltaX, velocity) {
    if (animating) return;

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

  function next() {
    goTo(1);
  }

  function prev() {
    goTo(-1);
  }

  function toggleOverlay() {
    overlayVisible = !overlayVisible;
    el.viewer.classList.toggle('overlay-visible', overlayVisible);
  }

  function closeOverlay() {
    if (!overlayVisible) return;
    overlayVisible = false;
    el.viewer.classList.remove('overlay-visible');
  }

  return {
    init,
    start,
    next,
    prev,
    toggleOverlay,
    onDragStart,
    onDragMove,
    onDragEnd,
  };
})();
