const Router = (() => {
  const homeScreen = () => Utils.qs('#screen-home');
  const viewerScreen = () => Utils.qs('#screen-viewer');

  function showHome() {
    homeScreen().classList.add('active');
    viewerScreen().classList.remove('active');
  }

  function showViewer() {
    viewerScreen().classList.add('active');
    homeScreen().classList.remove('active');
  }

  async function handleHash() {
    const hash = location.hash;
    const gradeMatch = hash.match(/^#\/grade\/(\d)$/);

    if (hash === '#/random') {
      showViewer();
      const children = await DataLoader.loadAllShuffled();
      Viewer.start(children);
    } else if (gradeMatch) {
      const grade = Number(gradeMatch[1]);
      showViewer();
      const data = await DataLoader.loadGrade(grade);
      Viewer.start(data.children);
    } else {
      showHome();
    }
  }

  function navigate(hash) {
    if (location.hash === hash) {
      handleHash();
    } else {
      location.hash = hash;
    }
  }

  function init() {
    window.addEventListener('hashchange', handleHash);
    handleHash();
  }

  return { init, navigate };
})();
