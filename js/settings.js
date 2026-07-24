const Settings = (() => {
  const STORAGE_KEY = 'phih-settings';
  const DEFAULTS = { showInfo: true, showHand: true };

  let state = { ...DEFAULTS };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      state = {
        showInfo: typeof parsed.showInfo === 'boolean' ? parsed.showInfo : DEFAULTS.showInfo,
        showHand: typeof parsed.showHand === 'boolean' ? parsed.showHand : DEFAULTS.showHand,
      };
    } catch (e) {
      state = { ...DEFAULTS };
    }
    return state;
  }

  function set(partial) {
    state = { ...state, ...partial };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // storage unavailable (private mode, quota, etc.) - keep in-memory state only
    }
    return state;
  }

  function get() {
    return state;
  }

  return { load, get, set };
})();
