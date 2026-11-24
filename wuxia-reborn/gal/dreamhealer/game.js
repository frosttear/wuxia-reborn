const $ = id => document.getElementById(id);
const overlay = $('overlay');
const unlockKey = 'dreamhealer.chapter1.unlocks';
const coverKey = 'dreamhealer.chapter1.cover';
const savePrefix = 'dreamhealer-tyrano_tyrano_';
const covers = [
  ['dream', '血红之梦'],
  ['case', '扬城疑案'],
  ['coffee', '舒颜咖啡']
];
const chapters = { 1: ['第一章', 16], 2: ['第二章', 13], 3: ['第三章', 15] };
const unlocked = new Set(read(unlockKey) ?? []);
let coverIndex = Math.max(
  0,
  covers.findIndex(([scene]) => scene === read(coverKey)),
  unlocked.has('yan') ? 2 : unlocked.has('shen') ? 1 : 0
);
let frame;
let engine;
let bootTimeout;
let launchMode;
let saving = false;

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function store(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    $('status').textContent = '浏览器存储不可用';
  }
}

function hasSave(kind) {
  try {
    return Boolean(localStorage.getItem(savePrefix + kind + '_save'));
  } catch {
    return false;
  }
}

function clearRuntime() {
  clearTimeout(bootTimeout);
  engine = undefined;
  frame?.remove();
  frame = undefined;
}

function showMenu(message = '') {
  clearRuntime();
  saving = false;
  const [scene, label] = covers[coverIndex];
  $('main-menu').dataset.cover = scene;
  $('menu-scene').textContent = label;
  $('menu-scene').hidden = scene === 'coffee';
  $('cover').src = 'assets/title-' + scene + '.webp';
  const manualSave = hasSave('quick');
  const canResume = hasSave('auto') || manualSave;
  $('resume').hidden = !canResume;
  $('menu-load').hidden = !manualSave;
  $('start').textContent = canResume ? '重新开始' : '开始游戏';
  $('menu-status').textContent = message;
  $('game').hidden = true;
  $('main-menu').hidden = false;
  $(canResume ? 'resume' : 'start').focus({ preventScroll: true });
}

function launch(mode) {
  clearRuntime();
  launchMode = mode;
  $('retry').hidden = true;
  $('status').textContent = '正在载入剧情…';
  $('main-menu').hidden = true;
  $('game').hidden = false;
  $('stage').setAttribute('aria-busy', 'true');
  $('stage').removeAttribute('data-restoring');
  $('progress').textContent = '';
  for (const id of ['history', 'save', 'load']) $(id).disabled = true;
  const runtimeFrame = document.createElement('iframe');
  frame = runtimeFrame;
  runtimeFrame.title = '梦境诊疗师 · TyranoScript 剧情';
  runtimeFrame.addEventListener('load', () => {
    if (frame === runtimeFrame && !engine && !runtimeFrame.contentDocument?.getElementById('tyrano_base')) {
      clearTimeout(bootTimeout);
      runtimeFrame.hidden = true;
      $('stage').setAttribute('aria-busy', 'false');
      $('status').textContent = '暂时无法载入游戏引擎。';
      $('retry').hidden = false;
    }
  });
  runtimeFrame.src = 'engine/index.html';
  $('stage').append(runtimeFrame);
  bootTimeout = setTimeout(() => {
    if (frame !== runtimeFrame || engine) return;
    $('status').textContent = '引擎加载较慢，可以继续等待或重新加载。';
    $('retry').hidden = false;
  }, 12000);
}

window.dreamhealer = {
  ready(runtime) {
    if (frame?.contentWindow !== runtime) return;
    clearTimeout(bootTimeout);
    $('retry').hidden = true;
    $('status').textContent = '正在载入剧情…';
    engine = runtime.TYRANO.kag;
    engine.on('storage-quicksave', () => {
      saving = false;
      $('save').disabled = false;
      $('load').disabled = false;
      $('status').textContent = '已存档';
    });
    if (launchMode === 'auto' && hasSave('auto')) restoreSave('auto');
    else if (launchMode !== 'new' && hasSave('quick')) restoreSave('quick');
    else engine.ftag.nextOrderWithLabel('', 'chapter1.ks');
    frame.focus();
  },

  restored(beat) {
    $('stage').removeAttribute('data-restoring');
    if (beat) this.reached(beat);
    $('status').textContent = '已读取存档';
  },

  reached({ n, scene, discoveries, chapter = 1, ended = false }) {
    $('stage').setAttribute('aria-busy', 'false');
    const [title, total] = chapters[chapter];
    $('chapter-name').textContent = title;
    $('progress').textContent = ended ? ' · 已完成' : ' · ' + n + ' / ' + total;
    for (const id of ['history', 'save']) $(id).disabled = false;
    $('load').disabled = !hasSave('quick');
    $('status').textContent = '';
    const fresh = discoveries.filter(key => !unlocked.has(key));
    if (fresh.length) {
      fresh.forEach(key => unlocked.add(key));
      store(unlockKey, [...unlocked]);
      $('status').textContent ||= '图鉴已更新';
    }
    const reachedCover = covers.findIndex(([key]) => key === scene);
    if (reachedCover > coverIndex) {
      coverIndex = reachedCover;
      store(coverKey, scene);
    }
  },

  home: showMenu
};

function restoreSave(kind) {
  const stage = $('stage');
  if (stage.hasAttribute('data-restoring')) return;
  stage.setAttribute('data-restoring', '');
  stage.setAttribute('aria-busy', 'true');
  for (const id of ['history', 'save', 'load']) $(id).disabled = true;
  $('status').textContent = '正在读取存档…';
  if (kind === 'auto') engine.menu.loadAutoSave();
  else engine.menu.loadQuickSave();
}

function portraitUrl(art) {
  return 'assets/' + art + '.webp';
}

function openDialog(title) {
  $('dialog-title').textContent = title;
  $('dialog-content').replaceChildren();
  overlay.showModal();
  return $('dialog-content');
}

function catalogPortrait(art) {
  const slot = document.createElement('div');
  slot.className = 'catalog-portrait';
  const placeholder = document.createElement('div');
  placeholder.className = 'portrait-placeholder';
  placeholder.textContent = '加载中';
  const img = document.createElement('img');
  img.alt = '';
  img.hidden = true;
  slot.append(placeholder, img);

  img.src = portraitUrl(art);
  img.decode().then(() => {
    img.hidden = false;
    placeholder.hidden = true;
  }, () => {
    placeholder.textContent = '立绘暂未加载';
  });
  return slot;
}

function showCatalog() {
  const content = openDialog('图鉴');
  const tabs = document.createElement('div');
  const grid = document.createElement('div');
  tabs.className = 'tabs';
  grid.className = 'cards';
  content.append(tabs, grid);
  const categories = ['人物', '线索'];

  function select(category) {
    grid.replaceChildren();
    [...tabs.children].forEach(button => {
      button.setAttribute('aria-pressed', String(button.textContent === category));
    });
    for (const [key, [name, type, description, art]] of Object.entries(notes)) {
      if (type !== category) continue;
      const known = unlocked.has(key);
      const card = document.createElement('article');
      card.className = 'card';
      if (known && art) card.append(catalogPortrait(art));
      const heading = document.createElement('strong');
      const detail = document.createElement('p');
      heading.textContent = known ? name : '未解锁';
      detail.textContent = known ? description : '继续阅读以解锁。';
      card.append(heading, detail);
      grid.append(card);
    }
  }
  for (const type of categories) {
    const button = document.createElement('button');
    button.textContent = type;
    button.onclick = () => select(type);
    tabs.append(button);
  }
  select('人物');
}

$('start').onclick = () => launch('new');
$('resume').onclick = () => launch('auto');
$('menu-load').onclick = () => launch('quick');
$('menu-catalog').onclick = showCatalog;
$('catalog').onclick = showCatalog;
$('home').onclick = () => showMenu();
$('retry').onclick = () => launch(launchMode);
$('history').onclick = () => engine?.menu.displayLog();
$('save').onclick = () => {
  if (!engine || saving) return;
  if (engine.stat.is_adding_text || engine.stat.is_wait) {
    $('status').textContent = '等当前台词显示完再存档。';
    return;
  }
  saving = true;
  $('save').disabled = true;
  engine.stat.f.game_backlog = engine.variable.tf.system.backlog.slice();
  engine.menu.setQuickSave();
};
$('load').onclick = () => {
  if (!engine || !hasSave('quick')) return;
  restoreSave('quick');
};
showMenu();
