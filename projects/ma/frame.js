// #embed (index.html previews): no toolbar, the artboard fills the frame.
// #stage (the Screening Room): toolbar without the back link, fitted to the frame.
const MODE = window.location.hash.slice(1);
const EMBED = MODE === 'embed';
const STAGE = MODE === 'stage';
document.documentElement.classList.toggle('embed', EMBED);
document.documentElement.classList.toggle('in-stage', STAGE);
if (STAGE && window.parent !== window) {
  // tell the Screening Room the design is up, so it does not show its fallback
  window.addEventListener('load', () => window.parent.postMessage({type: 'design-ready', path: window.location.pathname}, '*'));
}

// Scale a fixed-size artboard to fit the window (never above 100 %).
// On narrow screens it fits the width and lets the page scroll.
function fitBoard(board, w, h) {
  const stage = board.parentElement;
  const room = stage.parentElement;
  const apply = () => {
    if (EMBED) {
      const s = Math.min(window.innerWidth / w, window.innerHeight / h);
      board.style.transform = `scale(${s})`;
      stage.style.width = `${Math.floor(w * s)}px`;
      stage.style.height = `${Math.floor(h * s)}px`;
      return;
    }
    const availW = room.clientWidth - 32;
    const availH = window.innerWidth < 720 && !STAGE ? Infinity : window.innerHeight - stage.getBoundingClientRect().top - (STAGE ? 12 : 40);
    const s = Math.min(1, availW / w, availH / h);
    board.style.transform = `scale(${s})`;
    stage.style.width = `${Math.floor(w * s)}px`;
    stage.style.height = `${Math.floor(h * s)}px`;
  };
  window.addEventListener('resize', apply);
  apply();
}

// Sun-colour swatches, the one lever every Ma design shares.
function sunSwatches(container, target) {
  const colours = [
    ['#E4572E', 'vermilion'],
    ['#F2B134', 'amber'],
    ['#D9D8D2', 'moon'],
    ['#7FA7C9', 'dusk blue'],
  ];
  colours.forEach(([hex, name], i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.style.background = hex;
    b.setAttribute('aria-label', `Sun colour: ${name}`);
    b.setAttribute('aria-pressed', String(i === 0));
    b.addEventListener('click', () => {
      target.style.setProperty('--sun', hex);
      container.querySelectorAll('.swatch').forEach((s) => s.setAttribute('aria-pressed', String(s === b)));
      target.dispatchEvent(new CustomEvent('sunchange', {detail: hex}));
    });
    container.appendChild(b);
  });
}
