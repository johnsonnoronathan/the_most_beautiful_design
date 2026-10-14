// Embedded (index.html previews): no toolbar, the artboard fills the frame.
const EMBED = window.location.hash === '#embed';
document.documentElement.classList.toggle('embed', EMBED);

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
    const availH = window.innerWidth < 720 ? Infinity : window.innerHeight - stage.getBoundingClientRect().top - 40;
    const s = Math.min(1, availW / w, availH / h);
    board.style.transform = `scale(${s})`;
    stage.style.width = `${Math.floor(w * s)}px`;
    stage.style.height = `${Math.floor(h * s)}px`;
  };
  window.addEventListener('resize', apply);
  apply();
}
