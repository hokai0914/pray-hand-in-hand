document.addEventListener('DOMContentLoaded', () => {
  Viewer.init();

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
    onSwipeLeft: () => Viewer.next(),
    onSwipeRight: () => Viewer.prev(),
  });

  Router.init();
});
