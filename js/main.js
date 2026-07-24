document.addEventListener('DOMContentLoaded', () => {
  Viewer.init();

  const settingsOverlay = Utils.qs('#settings-overlay');
  const settingInfo = Utils.qs('#setting-info');
  const settingHand = Utils.qs('#setting-hand');

  const currentSettings = Settings.load();
  settingInfo.checked = currentSettings.showInfo;
  settingHand.checked = currentSettings.showHand;
  Viewer.applySettings(currentSettings);

  Utils.qs('#settings-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    settingsOverlay.classList.add('visible');
  });

  Utils.qs('#settings-close').addEventListener('click', (e) => {
    e.stopPropagation();
    settingsOverlay.classList.remove('visible');
  });

  settingsOverlay.addEventListener('click', (e) => {
    if (e.target === settingsOverlay) settingsOverlay.classList.remove('visible');
  });

  settingInfo.addEventListener('change', () => {
    Viewer.applySettings(Settings.set({ showInfo: settingInfo.checked }));
  });

  settingHand.addEventListener('change', () => {
    Viewer.applySettings(Settings.set({ showHand: settingHand.checked }));
  });

  document.querySelectorAll('.grade-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      Router.navigate(`#/grade/${btn.dataset.grade}`);
    });
  });

  Utils.qs('#random-btn').addEventListener('click', () => {
    Router.navigate('#/random');
  });

  Utils.qs('#home-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    Router.navigate('#/');
  });

  Utils.qs('#chevron-left').addEventListener('click', (e) => {
    e.stopPropagation();
    Viewer.prev();
  });

  Utils.qs('#chevron-right').addEventListener('click', (e) => {
    e.stopPropagation();
    Viewer.next();
  });

  Gestures.init(Utils.qs('#viewer'), {
    onTap: () => Viewer.toggleOverlay(),
    onDoubleTap: () => Viewer.onDoubleTap(),
    isZoomed: () => Viewer.isZoomed(),
    onDragStart: () => Viewer.onDragStart(),
    onDragMove: (deltaX, deltaY) => Viewer.onDragMove(deltaX, deltaY),
    onDragEnd: (deltaX, deltaY, velocity) => Viewer.onDragEnd(deltaX, deltaY, velocity),
    onPinchStart: (mid) => Viewer.onPinchStart(mid),
    onPinchMove: (ratio, mid) => Viewer.onPinchMove(ratio, mid),
    onPinchEnd: () => Viewer.onPinchEnd(),
  });

  Router.init();
});
