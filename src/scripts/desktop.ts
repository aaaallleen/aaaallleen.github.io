/**
 * Client behaviour for the desktop shell.
 *
 *  - Theme toggle (persisted) and the live menu-bar clock.
 *  - Menu bar dropdowns: File / View / Help, keyboard operable.
 *  - Window manager for the one window on the page:
 *      close    -> window hides, desktop icons appear (app icon reopens it)
 *      minimize -> window shrinks into a dock tile (click restores)
 *      zoom     -> window fills the viewport width (persisted)
 *  - About dialog.
 *
 * Window state is deliberately per page load: every link is a real navigation,
 * so a visitor never lands on an empty desktop. Only theme and zoom persist.
 */

type WindowState = 'open' | 'minimized' | 'closed';
type Theme = 'light' | 'night';

const root = document.documentElement;
const body = document.body;
const win = document.querySelector<HTMLElement>('[data-window-el]');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const coarsePointer = matchMedia('(pointer: coarse)');

const $ = <T extends HTMLElement>(sel: string, from: ParentNode = document) => from.querySelector<T>(sel);
const $$ = <T extends HTMLElement>(sel: string, from: ParentNode = document) => Array.from(from.querySelectorAll<T>(sel));

const store = {
  get(key: string) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key: string, value: string) { try { localStorage.setItem(key, value); } catch {} },
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

const getState = (): WindowState => (body.dataset.window as WindowState) || 'open';

function animate(el: HTMLElement, frames: Keyframe[], duration: number): Promise<void> {
  if (reducedMotion.matches || typeof el.animate !== 'function') return Promise.resolve();
  const anim = el.animate(frames, { duration, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' });
  return anim.finished.then(() => anim.cancel(), () => {});
}

const TO_DOCK: Keyframe[] = [
  { transform: 'translateY(0) scale(1)', opacity: 1, transformOrigin: '50% 100%' },
  { transform: 'translateY(30vh) scale(.08)', opacity: 0, transformOrigin: '50% 100%' },
];
const FROM_DOCK = [...TO_DOCK].reverse();
const TO_CLOSED: Keyframe[] = [
  { transform: 'scale(1)', opacity: 1 },
  { transform: 'scale(.96)', opacity: 0 },
];
const FROM_CLOSED = [...TO_CLOSED].reverse();

let busy = false;

async function setState(next: WindowState) {
  const prev = getState();
  if (!win || busy || next === prev) return;
  busy = true;
  closeMenus();

  if (prev === 'open') {
    // Hide the window, then reveal the dock or the desktop.
    await animate(win, next === 'minimized' ? TO_DOCK : TO_CLOSED, next === 'minimized' ? 320 : 180);
    win.hidden = true;
    body.dataset.window = next;
    syncLabels();
    window.scrollTo({ top: 0 });
    (next === 'minimized' ? $('[data-action="restore"]') : $('[data-icon="app"]'))?.focus();
  } else if (next === 'open') {
    // Bring the window back from wherever it went.
    body.dataset.window = 'open';
    win.hidden = false;
    syncLabels();
    await animate(win, prev === 'minimized' ? FROM_DOCK : FROM_CLOSED, prev === 'minimized' ? 320 : 180);
    win.focus({ preventScroll: true });
  } else {
    // minimized <-> closed: nothing to animate, just swap surfaces.
    body.dataset.window = next;
    syncLabels();
  }

  busy = false;
}

/* ------------------------------------------------------------------ menus */

const menuButtons = $$<HTMLButtonElement>('[data-menu-btn]');
let openMenu: HTMLElement | null = null;

const buttonFor = (menu: HTMLElement) => menuButtons.find((b) => b.getAttribute('aria-controls') === menu.id);
const menuFor = (btn: HTMLElement) => document.getElementById(btn.getAttribute('aria-controls') ?? '');

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

const menuItems = () => (openMenu ? $$('[role="menuitem"]:not([hidden])', openMenu) : []);

menuButtons.forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (openMenu && openMenu === menuFor(btn)) closeMenus();
    else showMenu(btn, e.detail === 0 /* keyboard */);
  });
  // macOS behaviour: with one menu open, sliding across the bar switches menus.
  btn.addEventListener('pointerenter', () => {
    if (openMenu && openMenu !== menuFor(btn)) showMenu(btn);
  });
});

document.addEventListener('click', (e) => {
  const target = e.target as Element;
  if (openMenu && !target.closest('[data-menubar]')) closeMenus();
  if (!target.closest('[data-icon]')) deselectIcons();
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
      const btn = buttonFor(openMenu);
      const idx = btn ? menuButtons.indexOf(btn) : -1;
      const step = e.key === 'ArrowRight' ? 1 : -1;
      const nextBtn = menuButtons[(idx + step + menuButtons.length) % menuButtons.length];
      if (nextBtn) showMenu(nextBtn, true);
      break;
    }
    default: return;
  }
  e.preventDefault();
});

/* ---------------------------------------------------------------- actions */

document.addEventListener('click', (e) => {
  const el = (e.target as Element).closest<HTMLElement>('[data-action]');
  if (!el) return;
  switch (el.dataset.action) {
    case 'close': void setState('closed'); break;
    case 'minimize': void setState('minimized'); break;
    case 'restore': void setState('open'); break;
    case 'reopen': reopenWindow(el.dataset.href); break;
    case 'zoom': setZoom(!zoomed()); break;
    case 'theme': setTheme(theme() === 'night' ? 'light' : 'night'); break;
    case 'about': $<HTMLDialogElement>('[data-about]')?.showModal(); break;
  }
  if (el.closest('[role="menu"]')) closeMenus();
});

/* ---------------------------------------------------------- desktop icons */

const icons = $$('[data-icon]');

function deselectIcons() {
  icons.forEach((i) => i.setAttribute('aria-pressed', 'false'));
}

const samePage = (href: string) =>
  new URL(href, location.href).pathname.replace(/\/+$/, '') === location.pathname.replace(/\/+$/, '');

/**
 * Relaunching a closed app starts it fresh on Home; restoring a minimized one
 * keeps your place. If we are already on Home, just bring the window back.
 */
function reopenWindow(home?: string) {
  if (getState() === 'closed' && home && !samePage(home)) {
    location.assign(home);
    return;
  }
  void setState('open');
}

function openIcon(icon: HTMLElement) {
  deselectIcons();
  if (icon.dataset.icon === 'app') reopenWindow(icon.dataset.href);
  else if (icon.dataset.href) location.assign(icon.dataset.href);
}

icons.forEach((icon) => {
  // Click selects, a second click (or a double-click) opens — the Finder rhythm.
  // Touch has no hover or double-click culture, so a single tap opens.
  icon.addEventListener('click', () => {
    if (coarsePointer.matches || icon.getAttribute('aria-pressed') === 'true') openIcon(icon);
    else { deselectIcons(); icon.setAttribute('aria-pressed', 'true'); }
  });
  icon.addEventListener('dblclick', () => openIcon(icon));
});

/* ------------------------------------------------------------------ clock */

const clock = $('[data-clock]');
function tick() {
  if (!clock) return;
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'short' });
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  clock.textContent = `${day} ${time}`;
}
tick();
setTimeout(() => { tick(); setInterval(tick, 60_000); }, (60 - new Date().getSeconds()) * 1000);

/* ------------------------------------------------------------------- init */

/**
 * Re-apply saved preferences from localStorage. The inline <head> script does
 * this before first paint, but it does not run again when the browser restores
 * a page from the back-forward cache: pressing Back would then show the page
 * frozen with whatever theme it had when you left it. Also fired when another
 * tab changes the preference, so tabs stay in step.
 */
function applyStoredPrefs() {
  const t = store.get('theme');
  if (t === 'light' || t === 'night') root.setAttribute('data-theme', t);
  root.classList.toggle('is-zoomed', store.get('zoom') === '1');
  syncLabels();
}

window.addEventListener('pageshow', (e) => {
  if (!e.persisted) return;
  applyStoredPrefs();
  // Window state is per visit, so a restored page always comes back open.
  if (win && getState() !== 'open') {
    body.dataset.window = 'open';
    win.hidden = false;
    deselectIcons();
    syncLabels();
  }
});

window.addEventListener('storage', (e) => {
  if (e.key === 'theme' || e.key === 'zoom' || e.key === null) applyStoredPrefs();
});

syncLabels();
