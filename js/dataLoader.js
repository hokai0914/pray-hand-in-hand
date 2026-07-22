const DataLoader = (() => {
  const cache = {};

  async function loadGrade(n) {
    if (cache[n]) return cache[n];
    const res = await fetch(`data/grade-${n}.json`);
    const data = await res.json();
    cache[n] = data;
    return data;
  }

  async function loadAllShuffled() {
    const grades = await Promise.all([1, 2, 3, 4, 5, 6].map(loadGrade));
    const flat = grades.flatMap((g) =>
      g.children.map((c) => ({ ...c, grade: g.grade }))
    );
    return Utils.shuffle(flat);
  }

  return { loadGrade, loadAllShuffled };
})();
