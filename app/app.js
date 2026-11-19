// Leonida Legends — GTA VI trophy guide & tracker.
// Loads app/data/trophies.json, renders the checklist, roadmap and detail views,
// and saves earned trophies to localStorage. No network requests besides the
// relative fetch of the local data file; source links are plain anchors.
const STORE_KEY = 'leonida-legends-earned-v1';
const listEl = document.getElementById('trophy-list');
const metaEl = document.getElementById('list-meta');
const emptyEl = document.getElementById('empty-msg');
const earnedCountEl = document.getElementById('earned-count');
const progressFillEl = document.getElementById('progress-fill');
const progressNoteEl = document.getElementById('progress-note');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('grade-filter');
const spoilerEl = document.getElementById('spoiler-toggle');
const earnedOnlyEl = document.getElementById('earned-only');

const params = new URLSearchParams(location.search);
const state = {
  trophies: [],
  earned: new Set(),
  kind: 'all',
  grade: params.get('grade') || 'all',
  query: '',
  spoiler: params.get('spoiler') === 'on',
  earnedOnly: false,
  view: params.get('view') === 'roadmap' ? 'roadmap' : 'list',
  detailId: params.get('trophy') ? Number(params.get('trophy')) : null,
};

function loadEarned() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]');
    if (Array.isArray(raw)) state.earned = new Set(raw.filter((n) => typeof n === 'number'));
  } catch {
    state.earned = new Set();
  }
}

function saveEarned() {
  localStorage.setItem(STORE_KEY, JSON.stringify([...state.earned].sort((a, b) => a - b)));
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function kindLabel(kind) {
  return kind === 'story' ? 'Story' : kind === 'collectibles' ? 'Collectibles' : 'Activities';
}

function trophyIsSpoilerHidden(t) {
  return state.spoiler && t.kind === 'story' && !state.earned.has(t.id);
}

function visibleTrophies() {
  const q = state.query.trim().toLowerCase();
  return state.trophies.filter((t) => {
    if (state.kind === 'missable' && !t.missable) return false;
    if (state.kind !== 'all' && state.kind !== 'missable' && t.kind !== state.kind) return false;
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (state.earnedOnly && !state.earned.has(t.id)) return false;
    if (q) {
      const hay = `${t.name} ${t.description} ${t.guide} ${kindLabel(t.kind)}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function sourceNode(sourceText) {
  const span = document.createElement('span');
  const urlMatch = sourceText.match(/https?:\/\/\S+/);
  if (!urlMatch) {
    span.textContent = sourceText;
    return span;
  }
  const before = sourceText.slice(0, urlMatch.index);
  const url = urlMatch[0].replace(/[).,;]+$/, '');
  const after = sourceText.slice(urlMatch.index + url.length);
  span.append(document.createTextNode(before));
  const link = document.createElement('a');
  link.href = url;
  link.textContent = url.replace(/^https?:\/\//, '');
  link.rel = 'noopener';
  span.append(link);
  span.append(document.createTextNode(after));
  return span;
}

function buildCard(t) {
  const li = document.createElement('li');
  li.className = 'trophy-card' + (state.earned.has(t.id) ? ' earned' : '');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.className = 'earned-box';
  box.checked = state.earned.has(t.id);
  box.setAttribute('aria-label', `Mark ${t.name} as earned`);
  box.addEventListener('change', () => {
    if (box.checked) state.earned.add(t.id);
    else state.earned.delete(t.id);
    saveEarned();
    renderAll();
  });
  li.append(box);

  const body = document.createElement('div');
  body.className = trophyIsSpoilerHidden(t) ? 'card-body spoiler-hidden' : 'card-body';
  const head = document.createElement('div');
  head.className = 'card-head';
  const name = document.createElement('h3');
  name.className = 'trophy-name';
  name.textContent = t.name;
  const badge = document.createElement('span');
  badge.className = `badge ${t.grade}`;
  badge.textContent = gradeLabel(t.grade);
  head.append(name, badge);
  const kindTag = document.createElement('span');
  kindTag.className = `tag ${t.kind}`;
  kindTag.textContent = kindLabel(t.kind);
  head.append(kindTag);
  if (t.missable) {
    const miss = document.createElement('span');
    miss.className = 'tag missable';
    miss.textContent = 'Missable — story-locked';
    head.append(miss);
  }
  body.append(head);

  const desc = document.createElement('p');
  desc.className = 'trophy-desc';
  desc.textContent = t.description;
  body.append(desc);
  if (trophyIsSpoilerHidden(t)) {
    const note = document.createElement('p');
    note.className = 'spoiler-note';
    note.textContent = 'Hidden by spoiler-safe mode — tick it as earned to reveal the name and description.';
    body.append(note);
  }
  const guide = document.createElement('p');
  guide.className = 'guide';
  const label = document.createElement('span');
  label.className = 'guide-label';
  label.textContent = 'Guide — ';
  guide.append(label, document.createTextNode(t.guide));
  body.append(guide);
  const source = document.createElement('p');
  source.className = 'source';
  source.append(document.createTextNode('Source: '), sourceNode(t.source));
  body.append(source);
  const actions = document.createElement('div');
  actions.className = 'card-actions';
  const openBtn = document.createElement('button');
  openBtn.type = 'button';
  openBtn.className = 'guide-btn';
  openBtn.textContent = 'Open full guide';
  openBtn.addEventListener('click', () => showDetail(t.id));
  actions.append(openBtn);
  body.append(actions);
  li.append(body);
  return li;
}

function renderList() {
  const shown = visibleTrophies();
  listEl.replaceChildren(...shown.map(buildCard));
  emptyEl.hidden = shown.length !== 0;
  metaEl.textContent = `Showing ${shown.length} of ${state.trophies.length} trophies` +
    (state.spoiler ? ' · spoiler-safe mode on: story trophies stay hidden until earned' : '');
}

function renderProgress() {
  const total = state.trophies.length;
  const got = state.earned.size;
  const pct = total ? Math.round((got / total) * 100) : 0;
  earnedCountEl.textContent = `${got} / ${total} earned`;
  progressFillEl.style.width = `${pct}%`;
  progressNoteEl.textContent = got === total && total > 0
    ? 'Platinum earned — Vice Got a Price! You are a Leonida Legend.'
    : `${pct}% of the way to the platinum — ${total - got} trophies to go.`;
}

function setView(view) {
  state.view = view;
  document.getElementById('view-list').hidden = view !== 'list';
  document.getElementById('view-roadmap').hidden = view !== 'roadmap';
  document.getElementById('view-detail').hidden = view !== 'detail';
  document.getElementById('btn-view-list').classList.toggle('active', view === 'list');
  document.getElementById('btn-view-roadmap').classList.toggle('active', view === 'roadmap');
  document.getElementById('btn-view-detail').hidden = view !== 'detail';
  document.getElementById('btn-view-detail').classList.toggle('active', view === 'detail');
}

function roadmapItem(t) {
  const li = document.createElement('li');
  const mark = document.createElement('span');
  mark.className = 'earned-mark';
  mark.textContent = state.earned.has(t.id) ? '✓ ' : '';
  li.append(mark, document.createTextNode(`${t.name} — ${t.description}`));
  return li;
}

function renderRoadmap() {
  const story = state.trophies.filter((t) => t.kind === 'story').sort((a, b) => a.id - b.id);
  document.getElementById('roadmap-story').replaceChildren(...story.map(roadmapItem));
  const mid = state.trophies.filter((t) => t.kind !== 'story' && t.id !== 1 && t.id !== 14);
  const midList = document.getElementById('roadmap-activities');
  midList.replaceChildren(...mid.map((t) => {
    const li = document.createElement('li');
    const mark = document.createElement('span');
    mark.className = 'earned-mark';
    mark.textContent = state.earned.has(t.id) ? '✓ ' : '';
    li.append(mark, document.createTextNode(`${t.name} (${kindLabel(t.kind)}) — ${t.description}`));
    return li;
  }));
  const cleanup = state.trophies.filter((t) => t.id === 14 || t.id === 1);
  document.getElementById('roadmap-cleanup').replaceChildren(...cleanup.map(roadmapItem));
}

function showDetail(id) {
  const t = state.trophies.find((x) => x.id === id);
  if (!t) return;
  state.detailId = id;
  const card = document.getElementById('detail-card');
  card.replaceChildren();
  const badges = document.createElement('div');
  badges.className = 'meta-row';
  const badge = document.createElement('span');
  badge.className = `badge ${t.grade}`;
  badge.textContent = gradeLabel(t.grade);
  badges.append(badge);
  const kindTag = document.createElement('span');
  kindTag.className = `tag ${t.kind}`;
  kindTag.textContent = kindLabel(t.kind);
  badges.append(kindTag);
  if (t.missable) {
    const miss = document.createElement('span');
    miss.className = 'tag missable';
    miss.textContent = 'Missable — story-locked to its chapter or mission';
    badges.append(miss);
  }
  card.append(badges);
  const name = document.createElement('h2');
  name.textContent = t.name;
  const desc = document.createElement('p');
  desc.className = 'trophy-desc';
  desc.textContent = t.description;
  const guide = document.createElement('p');
  guide.className = 'guide';
  const label = document.createElement('span');
  label.className = 'guide-label';
  label.textContent = 'Guide — ';
  guide.append(label, document.createTextNode(t.guide));
  const source = document.createElement('p');
  source.className = 'source';
  source.append(document.createTextNode('Source: '), sourceNode(t.source));
  const tick = document.createElement('div');
  tick.className = 'card-actions';
  const tickBtn = document.createElement('button');
  tickBtn.type = 'button';
  tickBtn.className = 'guide-btn';
  tickBtn.textContent = state.earned.has(t.id) ? '✓ Earned — click to unmark' : 'Mark as earned';
  tickBtn.addEventListener('click', () => {
    if (state.earned.has(t.id)) state.earned.delete(t.id);
    else state.earned.add(t.id);
    saveEarned();
    renderAll();
    showDetail(t.id);
  });
  tick.append(tickBtn);
  card.append(name, desc, guide, source, tick);
  setView('detail');
  window.scrollTo(0, 0);
}

function renderAll() {
  renderProgress();
  renderList();
  renderRoadmap();
}

function exportProgress() {
  const payload = {
    app: 'leonida-legends',
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...state.earned].sort((a, b) => a - b),
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(url);
}

async function importProgress(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(ids)) throw new Error('no earned list');
    const known = new Set(state.trophies.map((t) => t.id));
    state.earned = new Set(ids.filter((n) => typeof n === 'number' && known.has(n)));
    saveEarned();
    renderAll();
  } catch {
    alert('That file is not a Leonida Legends progress export.');
  }
}

function wireEvents() {
  document.getElementById('btn-view-list').addEventListener('click', () => setView('list'));
  document.getElementById('btn-view-roadmap').addEventListener('click', () => setView('roadmap'));
  document.getElementById('back-btn').addEventListener('click', () => setView('list'));
  searchEl.addEventListener('input', () => { state.query = searchEl.value; renderList(); });
  gradeEl.addEventListener('change', () => { state.grade = gradeEl.value; renderList(); });
  spoilerEl.addEventListener('change', () => { state.spoiler = spoilerEl.checked; renderList(); });
  earnedOnlyEl.addEventListener('change', () => { state.earnedOnly = earnedOnlyEl.checked; renderList(); });
  document.getElementById('kind-chips').addEventListener('click', (event) => {
    const chip = event.target.closest('[data-kind]');
    if (!chip) return;
    state.kind = chip.dataset.kind;
    document.querySelectorAll('#kind-chips .chip').forEach((c) => c.classList.toggle('active', c === chip));
    renderList();
  });
  document.getElementById('export-btn').addEventListener('click', exportProgress);
  document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-file').click());
  document.getElementById('import-file').addEventListener('change', (event) => {
    importProgress(event.target.files[0]);
    event.target.value = '';
  });
}

async function init() {
  loadEarned();
  const doc = await (await fetch('data/trophies.json')).json();
  state.trophies = doc.trophies;
  if (state.grade !== 'all' && !['platinum', 'gold', 'silver', 'bronze'].includes(state.grade)) state.grade = 'all';
  gradeEl.value = state.grade;
  spoilerEl.checked = state.spoiler;
  wireEvents();
  renderAll();
  if (state.detailId) showDetail(state.detailId);
  else if (state.view === 'roadmap') setView('roadmap');
  else setView('list');
}

init();
