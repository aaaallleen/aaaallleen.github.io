/**
 * Client behaviour for the desktop shell.
 *
 *  - Theme toggle (persisted) and the live menu-bar clock.
 *  - Menu bar dropdowns: File / View / Help, keyboard operable.
 *  - Window manager for the one window on the page:
 *      close    -> window hides, desktop icons appear (app icon relaunches on Home)
 *      minimize -> window shrinks into a dock tile (click restores)
 *      zoom     -> window fills the viewport width (persisted)
 *      drag     -> move the window by its title bar (remembered per visit)
 *  - About dialog.
 *
 * Pages are swapped in place by Astro's client router, so this module runs
 * once per visit. Everything that touches the DOM is either delegated at the
 * document level (and looks elements up live) or re-bound in init(), which
 * runs on every `astro:page-load`.
 *
 * Window state is deliberately per page: every link is a real page in the
 * static build, so a visitor never lands on an empty desktop. Only theme and
 * zoom persist across visits; drag position persists for the visit.
 */
import { navigate } from 'astro:transitions/client';

type WindowState = 'open' | 'minimized' | 'closed';
type Theme = 'light' | 'night';

const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const coarsePointer = matchMedia('(pointer: coarse)');
const narrow = matchMedia('(max-width: 760px)');

const $ = <T extends HTMLElement>(sel: string, from: ParentNode = document) => from.querySelector<T>(sel);
const $$ = <T extends HTMLElement>(sel: string, from: ParentNode = document) => Array.from(from.querySelectorAll<T>(sel));
const win = () => $('[data-window-el]');

const store = {
  get(key: string) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key: string, value: string) { try { localStorage.setItem(key, value); } catch {} },
};
const session = {
  get(key: string) { try { return sessionStorage.getItem(key); } catch { return null; } },
  set(key: string, value: string) { try { sessionStorage.setItem(key, value); } catch {} },
  remove(key: string) { try { sessionStorage.removeItem(key); } catch {} },
};

/* ------------------------------------------------------------------ theme */

const theme = (): Theme => (root.getAttribute('data-theme') === 'night' ? 'night' : 'light');

function setTheme(next: Theme) {
  root.setAttribute('data-theme', next);
  store.set('theme', next);
  syncLabels();
}

/* ------------------------------------------------------------------- zoom */

const zoomed = () => root.classList.contains('is-zoomed');

function setZoom(on: boolean) {
  root.classList.toggle('is-zoomed', on);
  store.set('zoom', on ? '1' : '0');
  syncLabels();
}

/** Re-apply saved preferences (first paint is handled by the inline <head> script). */
function applyStoredPrefs() {
  const t = store.get('theme');
  if (t === 'light' || t === 'night') root.setAttribute('data-theme', t);
  root.classList.toggle('is-zoomed', store.get('zoom') === '1');
  syncLabels();
}

/* ----------------------------------------------------------------- labels */

/** Keep every dynamic label and state-dependent menu item in sync. */
function syncLabels() {
  const t = theme();
  const state = getState();
  $$('[data-theme-label]').forEach((el) => (el.textContent = t === 'night' ? 'Day' : 'Night'));
  $$('[data-zoom-label]').forEach((el) => (el.textContent = zoomed() ? 'Actual Size' : 'Fill Screen'));
  $$('[data-when]').forEach((el) => {
    el.hidden = !(el.dataset.when ?? '').split(/\s+/).includes(state);
  });
}

/* ----------------------------------------------------------- window state */

const getState = (): WindowState => (document.body.dataset.window as WindowState) || 'open';

function animate(el: HTMLElement, frames: Keyframe[], duration: number): Promise<void> {
  if (reducedMotion.matches || typeof el.animate !== 'function') return Promise.resolve();
  const anim = el.animate(frames, { duration, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' });
  return anim.finished.then(() => anim.cancel(), () => {});
}

// Where the window has been dragged to (see "drag" below); animations start from there.
const dragOffset = { x: 0, y: 0 };
const base = () => `translate(${dragOffset.x}px, ${dragOffset.y}px)`;
const TO_DOCK = (): Keyframe[] => [
  { transform: `${base()} translateY(0) scale(1)`, opacity: 1, transformOrigin: '50% 100%' },
  { transform: `${base()} translateY(30vh) scale(.08)`, opacity: 0, transformOrigin: '50% 100%' },
];
const FROM_DOCK = () => [...TO_DOCK()].reverse();
const TO_CLOSED = (): Keyframe[] => [
  { transform: `${base()} scale(1)`, opacity: 1 },
  { transform: `${base()} scale(.96)`, opacity: 0 },
];
const FROM_CLOSED = () => [...TO_CLOSED()].reverse();

/* ------------------------------------------------------------------- dock */

/**
 * There are exactly two windows: the site window ("site") and the folder
 * window ("folder"). Pages are views inside them, so the dock holds at most
 * one tile per window, remembering the page that window was left on. Only one
 * window is ever on screen; opening the other one parks the current one here.
 * Kind is derived from the URL: folder pages live under /home/.
 */
type Kind = 'site' | 'folder';
interface Tile { kind: Kind; href: string; title: string }
const DOCK_KEY = 'dock:tiles';
const BASE = (import.meta.env.BASE_URL as string).replace(/\/+$/, '');
const pathOf = (href: string) => new URL(href, location.href).pathname.replace(/\/+$/, '') || '/';
function kindOf(href: string): Kind {
  const p = pathOf(href);
  const rel = BASE && p.startsWith(BASE) ? p.slice(BASE.length) : p;
  return rel === '/home' || rel.startsWith('/home/') ? 'folder' : 'site';
}
const currentKind = (): Kind => (win()?.dataset.windowKind === 'folder' ? 'folder' : 'site');

const readTiles = (): Tile[] => {
  try {
    const t = JSON.parse(session.get(DOCK_KEY) ?? '[]');
    return Array.isArray(t) ? t.filter((x) => x && (x.kind === 'site' || x.kind === 'folder') && typeof x.href === 'string' && typeof x.title === 'string') : [];
  } catch { return []; }
};
const writeTiles = (tiles: Tile[]) => session.set(DOCK_KEY, JSON.stringify(tiles));

function currentTile(): Tile | null {
  if (!win()) return null;
  const title = $('[data-window-title]')?.textContent?.trim() || document.title;
  return { kind: currentKind(), href: location.pathname, title };
}

function renderDock() {
  const dock = $('[data-dock]');
  const tpl = dock?.querySelector('template');
  if (!dock || !tpl) return;
  const tiles = readTiles();
  dock.querySelectorAll('[data-dock-restore]').forEach((el) => el.remove());
  for (const t of tiles) {
    const node = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;
    node.dataset.href = t.href;
    node.dataset.kind = t.kind;
    node.classList.toggle('folder', t.kind === 'folder');
    node.setAttribute('aria-label', `Restore ${t.title}`);
    node.querySelector('.tile-label')!.textContent = t.title;
    dock.appendChild(node);
  }
  dock.hidden = tiles.length === 0;
  document.body.classList.toggle('has-dock', tiles.length > 0);
}

/** Park a window in the dock (replacing that window's earlier tile, if any). */
function addTile(tile: Tile) {
  const tiles = readTiles().filter((t) => t.kind !== tile.kind);
  tiles.push(tile);
  writeTiles(tiles);
  renderDock();
}

function removeTile(kind: Kind) {
  writeTiles(readTiles().filter((t) => t.kind !== kind));
  renderDock();
}

function restoreTile(href: string) {
  if (samePage(href)) { void setState('open'); return; }
  // Navigating parks whichever window is on screen (see astro:before-preparation)
  // and the arriving page removes its own window's tile.
  void navigate(href);
}

// Opening the other window while one is on screen parks the current one.
// Same-window navigation (sidebar links, tag views, posts from the list) does not.
// History traversal is "going back", not "opening a window", so it is left alone.
document.addEventListener('astro:before-preparation', (e) => {
  const ev = e as Event & { to?: URL; navigationType?: string };
  if (!ev.to || ev.navigationType === 'traverse' || getState() !== 'open') return;
  const cur = currentTile();
  if (cur && kindOf(ev.to.href) !== cur.kind) addTile(cur);
});

/* ------------------------------------------------------- per-window history */

/**
 * Each window keeps its own trail of pages for the toolbar "< Back" button, so
 * the site window's Back never lands in the folder window and vice versa. The
 * browser's own back button is untouched. Arriving at a page already in the
 * trail truncates to it (so browser back/forward and sidebar jumps stay sane);
 * closing a window clears its trail.
 */
const navKey = (k: Kind) => `nav:${k}`;
const readNav = (k: Kind): string[] => {
  try { const a = JSON.parse(session.get(navKey(k)) ?? '[]'); return Array.isArray(a) ? a.filter((x) => typeof x === 'string') : []; } catch { return []; }
};
const writeNav = (k: Kind, trail: string[]) => session.set(navKey(k), JSON.stringify(trail));

function recordVisit() {
  const k = currentKind();
  const here = pathOf(location.pathname);
  const trail = readNav(k);
  const i = trail.lastIndexOf(here);
  if (i >= 0) trail.length = i + 1; else trail.push(here);
  writeNav(k, trail);
}

function goBack(home: string) {
  const k = currentKind();
  const here = pathOf(location.pathname);
  const trail = readNav(k);
  const rest = trail[trail.length - 1] === here ? trail.slice(0, -1) : trail;
  const target = rest[rest.length - 1] ?? home;
  if (samePage(target)) return; // nowhere to go: leave the trail as it is
  writeNav(k, rest);
  void navigate(target);
}

let busy = false;

async function setState(next: WindowState) {
  const w = win();
  const prev = getState();
  if (!w || busy || next === prev) return;
  busy = true;
  closeMenus();

  if (prev === 'open') {
    // Hide the window, then reveal the dock or the desktop.
    await animate(w, next === 'minimized' ? TO_DOCK() : TO_CLOSED(), next === 'minimized' ? 320 : 180);
    w.hidden = true;
    document.body.dataset.window = next;
    syncLabels();
    window.scrollTo({ top: 0 });
    if (next === 'minimized') {
      const t = currentTile();
      if (t) addTile(t);
      $$<HTMLElement>('[data-dock-restore]').find((el) => el.dataset.kind === currentKind())?.focus();
    } else {
      removeTile(currentKind());
      writeNav(currentKind(), []);
      $('[data-icon="app"]')?.focus();
    }
  } else if (next === 'open') {
    // Bring the window back from wherever it went.
    document.body.dataset.window = 'open';
    w.hidden = false;
    removeTile(currentKind());
    syncLabels();
    await animate(w, prev === 'minimized' ? FROM_DOCK() : FROM_CLOSED(), prev === 'minimized' ? 320 : 180);
    w.focus({ preventScroll: true });
  } else {
    // minimized <-> closed: nothing to animate, just swap surfaces.
    document.body.dataset.window = next;
    if (next === 'closed') { removeTile(currentKind()); writeNav(currentKind(), []); }
    else { const t = currentTile(); if (t) addTile(t); }
    syncLabels();
  }

  busy = false;
}

/* ------------------------------------------------------------------ menus */

let openMenu: HTMLElement | null = null;

const menuButtons = () => $$<HTMLButtonElement>('[data-menu-btn]');
const buttonFor = (menu: HTMLElement) => menuButtons().find((b) => b.getAttribute('aria-controls') === menu.id);
const menuFor = (btn: HTMLElement) => document.getElementById(btn.getAttribute('aria-controls') ?? '');
const menuItems = () => (openMenu ? $$('[role="menuitem"]:not([hidden])', openMenu) : []);

function closeMenus() {
  if (!openMenu) return;
  const btn = buttonFor(openMenu);
  btn?.setAttribute('aria-expanded', 'false');
  btn?.classList.remove('is-open');
  openMenu.hidden = true;
  openMenu = null;
}

function showMenu(btn: HTMLElement, focusFirst = false) {
  const menu = menuFor(btn);
  if (!menu) return;
  if (openMenu && openMenu !== menu) closeMenus();
  menu.hidden = false;
  btn.setAttribute('aria-expanded', 'true');
  btn.classList.add('is-open');
  openMenu = menu;
  if (focusFirst) menuItems()[0]?.focus();
}

// macOS behaviour: with one menu open, sliding across the bar switches menus.
document.addEventListener('pointerover', (e) => {
  const btn = (e.target as Element).closest<HTMLElement>('[data-menu-btn]');
  if (btn && openMenu && openMenu !== menuFor(btn)) showMenu(btn);
});

document.addEventListener('keydown', (e) => {
  if (!openMenu) return;
  const items = menuItems();
  const i = items.indexOf(document.activeElement as HTMLElement);
  switch (e.key) {
    case 'Escape': {
      const btn = buttonFor(openMenu);
      closeMenus();
      btn?.focus();
      break;
    }
    case 'ArrowDown': items[(i + 1) % items.length]?.focus(); break;
    case 'ArrowUp': items[(i - 1 + items.length) % items.length]?.focus(); break;
    case 'ArrowRight':
    case 'ArrowLeft': {
      const btns = menuButtons();
      const btn = buttonFor(openMenu);
      const idx = btn ? btns.indexOf(btn) : -1;
      const step = e.key === 'ArrowRight' ? 1 : -1;
      const nextBtn = btns[(idx + step + btns.length) % btns.length];
      if (nextBtn) showMenu(nextBtn, true);
      break;
    }
    default: return;
  }
  e.preventDefault();
});

/* --------------------------------------------------------- clicks (delegated) */

const samePage = (href: string) =>
  new URL(href, location.href).pathname.replace(/\/+$/, '') === location.pathname.replace(/\/+$/, '');

/**
 * Relaunching a closed app starts it fresh on Home; restoring a minimized one
 * keeps your place. If we are already on Home, just bring the window back.
 */
function reopenWindow(home?: string) {
  if (getState() === 'closed' && home && !samePage(home)) {
    void navigate(home);
    return;
  }
  void setState('open');
}

function deselectIcons() {
  $$('[data-icon]').forEach((i) => i.setAttribute('aria-pressed', 'false'));
}

function openIcon(icon: HTMLElement) {
  deselectIcons();
  const href = icon.dataset.href;
  if (icon.dataset.icon === 'app') reopenWindow(href);
  else if (href && samePage(href)) void setState('open'); // the folder/file is this very page: just bring its window back
  else if (href) void navigate(href);
}

document.addEventListener('click', (e) => {
  const target = e.target as Element;

  // Menu bar buttons toggle their menu; a click anywhere else closes it.
  const menuBtn = target.closest<HTMLElement>('[data-menu-btn]');
  if (menuBtn) {
    if (openMenu && openMenu === menuFor(menuBtn)) closeMenus();
    else showMenu(menuBtn, e.detail === 0 /* keyboard */);
    return;
  }
  if (openMenu && (!target.closest('[data-menubar]') || target.closest('[role="menuitem"]'))) closeMenus();

  // Dock tiles bring a minimized window back.
  const tile = target.closest<HTMLElement>('[data-dock-restore]');
  if (tile) { restoreTile(tile.dataset.href ?? location.pathname); return; }

  // Desktop icons: click selects, a second click (or a double-click) opens — the
  // Finder rhythm. Touch has no double-click culture, so a single tap opens.
  const icon = target.closest<HTMLElement>('[data-icon]');
  if (icon) {
    if (coarsePointer.matches || icon.getAttribute('aria-pressed') === 'true') openIcon(icon);
    else { deselectIcons(); icon.setAttribute('aria-pressed', 'true'); }
    return;
  }
  deselectIcons();

  // Named actions on buttons and menu items.
  const el = target.closest<HTMLElement>('[data-action]');
  if (!el) return;
  switch (el.dataset.action) {
    case 'close': void setState('closed'); break;
    case 'minimize': void setState('minimized'); break;
    case 'restore': void setState('open'); break;
    case 'reopen': reopenWindow(el.dataset.href); break;
    case 'zoom': setZoom(!zoomed()); break;
    case 'theme': setTheme(theme() === 'night' ? 'light' : 'night'); break;
    case 'about': $<HTMLDialogElement>('[data-about]')?.showModal(); break;
    case 'back': goBack(el.dataset.home ?? '/'); break; // this window's own trail
  }
});

document.addEventListener('dblclick', (e) => {
  const icon = (e.target as Element).closest<HTMLElement>('[data-icon]');
  if (icon) openIcon(icon);
});

/* ------------------------------------------------------------------- drag */

/**
 * Drag a window by its title bar. The offset is a CSS transform, clamped so
 * the title bar always stays reachable, and remembered per window kind in
 * sessionStorage so it survives navigation within a visit (a new visit starts
 * centered again). Disabled when zoomed, on narrow screens where the window is
 * already full width, and on touch, where the gesture would fight scrolling.
 * Double-click the title bar to re-center.
 */
const MENUBAR = 26;
const KEEP = 120; // px of the window that must remain on screen horizontally
const canDrag = () => !zoomed() && !narrow.matches && !coarsePointer.matches;
const posKey = (w: HTMLElement) => `window-pos:${w.dataset.windowKind ?? 'window'}`;

function place(w: HTMLElement, x: number, y: number) {
  const rect = w.getBoundingClientRect();
  // Position of the untransformed window, in viewport and document coordinates.
  const baseLeft = rect.left - dragOffset.x;
  const baseTop = rect.top - dragOffset.y;
  const minX = KEEP - (baseLeft + rect.width);
  const maxX = innerWidth - KEEP - baseLeft;
  const minY = MENUBAR + 6 - (baseTop + scrollY); // never above the menu bar
  const maxY = innerHeight - 30 - baseTop; // title bar stays inside the viewport while dragging
  dragOffset.x = Math.round(Math.min(Math.max(x, minX), maxX));
  dragOffset.y = Math.round(Math.min(Math.max(y, minY), Math.max(minY, maxY)));
  w.style.transform = dragOffset.x || dragOffset.y ? base() : '';
}

function restorePosition(w: HTMLElement) {
  dragOffset.x = 0; dragOffset.y = 0;
  w.style.transform = '';
  try {
    const saved = JSON.parse(session.get(posKey(w)) ?? 'null');
    if (saved && typeof saved.x === 'number' && typeof saved.y === 'number' && canDrag()) place(w, saved.x, saved.y);
  } catch {}
}

document.addEventListener('pointerdown', (e) => {
  const handle = (e.target as Element).closest<HTMLElement>('[data-drag-handle]');
  const w = handle?.closest<HTMLElement>('[data-window-el]');
  if (!handle || !w || e.button !== 0 || !canDrag()) return;
  if ((e.target as Element).closest('button, a')) return; // traffic lights
  const startX = e.clientX - dragOffset.x;
  const startY = e.clientY - dragOffset.y;
  handle.setPointerCapture(e.pointerId);
  document.body.classList.add('is-dragging');
  w.classList.add('is-dragging');
  const move = (ev: PointerEvent) => place(w, ev.clientX - startX, ev.clientY - startY);
  const stop = () => {
    handle.removeEventListener('pointermove', move);
    handle.removeEventListener('pointerup', stop);
    handle.removeEventListener('pointercancel', stop);
    document.body.classList.remove('is-dragging');
    w.classList.remove('is-dragging');
    session.set(posKey(w), JSON.stringify(dragOffset));
  };
  handle.addEventListener('pointermove', move);
  handle.addEventListener('pointerup', stop);
  handle.addEventListener('pointercancel', stop);
  e.preventDefault();
});

document.addEventListener('dblclick', (e) => {
  const handle = (e.target as Element).closest<HTMLElement>('[data-drag-handle]');
  const w = handle?.closest<HTMLElement>('[data-window-el]');
  if (!handle || !w || (e.target as Element).closest('button, a')) return;
  dragOffset.x = 0; dragOffset.y = 0;
  w.style.transform = '';
  session.remove(posKey(w));
});

// If the viewport shrinks (or the layout goes narrow), keep the window reachable.
addEventListener('resize', () => {
  const w = win();
  if (!w) return;
  if (!canDrag()) { w.style.transform = ''; return; }
  place(w, dragOffset.x, dragOffset.y);
});

/* ------------------------------------------------------------------ clock */

function tick() {
  const clock = $('[data-clock]');
  if (!clock) return;
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'short' });
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  clock.textContent = `${day} ${time}`;
}
tick();
setTimeout(() => { tick(); setInterval(tick, 60_000); }, (60 - new Date().getSeconds()) * 1000);

/* ------------------------------------------------------------------- init */

/** Per-page setup: runs on first load and after every client-side navigation. */
function init() {
  busy = false;
  openMenu = null;
  $$('[data-menu-btn]').forEach((b) => { b.setAttribute('aria-expanded', 'false'); b.classList.remove('is-open'); });
  $$('[role="menu"]').forEach((m) => (m.hidden = true));
  const w = win();
  if (w) restorePosition(w);
  removeTile(currentKind()); // this page's window is on screen; also renders the dock
  recordVisit();
  syncLabels();
  tick();
}

// The client router swaps <html> attributes from the incoming page; put the
// saved theme and zoom back before the new page paints.
document.addEventListener('astro:after-swap', applyStoredPrefs);
document.addEventListener('astro:page-load', init);

window.addEventListener('pageshow', (e) => {
  if (!e.persisted) return;
  // Restored from the back-forward cache: re-apply preferences and reset the
  // per-page window state so a frozen bare desktop never comes back.
  applyStoredPrefs();
  const w = win();
  if (w && getState() !== 'open') {
    document.body.dataset.window = 'open';
    w.hidden = false;
    deselectIcons();
    syncLabels();
  }
  removeTile(currentKind());
});

window.addEventListener('storage', (e) => {
  if (e.key === 'theme' || e.key === 'zoom' || e.key === null) applyStoredPrefs();
});
