const Viewer = (() => {
  let sequence = [];
  let currentIndex = 0;
  let overlayVisible = false;
  let hintPlayed = false;

  const el = {
    viewer: null,
    backdrop: null,
    nameLabel: null,
    photo: null,
    prayerText: null,
    chevronLeft: null,
    chevronRight: null,
    dots: null,
  };

  function init() {
    el.viewer = Utils.qs('#viewer');
    el.backdrop = Utils.qs('#viewer-backdrop');
    el.nameLabel = Utils.qs('#name-label');
    el.photo = Utils.qs('#child-photo');
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
    el.viewer.classList.remove('overlay-visible');
    renderDots();
    render({ playHint: true });
  }

  function render({ playHint } = {}) {
    const child = sequence[currentIndex];
    if (!child) return;

    const url = Utils.buildImageUrl(child.image);
    el.photo.src = url;
    el.photo.alt = child.name;
    el.backdrop.style.backgroundImage = `url("${url}")`;
    el.nameLabel.textContent = child.name;
    el.prayerText.textContent = child.prayer;

    el.chevronLeft.classList.toggle('hidden', currentIndex === 0);
    el.chevronRight.classList.toggle('hidden', currentIndex === sequence.length - 1);

    updateDots();
    preloadNeighbors();

    if (playHint && !hintPlayed) {
      hintPlayed = true;
      requestAnimationFrame(() => {
        el.photo.classList.add('swipe-hint');
        el.chevronLeft.classList.add('pulse');
        el.chevronRight.classList.add('pulse');
        setTimeout(() => {
          el.photo.classList.remove('swipe-hint');
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

  function preloadNeighbors() {
    [currentIndex - 1, currentIndex + 1].forEach((i) => {
      const child = sequence[i];
      if (!child) return;
      const img = new Image();
      img.src = Utils.buildImageUrl(child.image);
    });
  }

  function next() {
    if (currentIndex >= sequence.length - 1) return;
    currentIndex += 1;
    closeOverlay();
    render({});
  }

  function prev() {
    if (currentIndex <= 0) return;
    currentIndex -= 1;
    closeOverlay();
    render({});
  }

  function toggleOverlay() {
    overlayVisible = !overlayVisible;
    el.viewer.classList.toggle('overlay-visible', overlayVisible);
  }

  function closeOverlay() {
    overlayVisible = false;
    el.viewer.classList.remove('overlay-visible');
  }

  return { init, start, next, prev, toggleOverlay };
})();
