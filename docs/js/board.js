/**
 * The dartboard: segment order, geometry and the SVG that players tap.
 */

/* ---------- dartboard ---------- */
const ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

const P = (r, a) => [r * Math.sin((a * Math.PI) / 180), -r * Math.cos((a * Math.PI) / 180)];

const arc = (r1, r2, a1, a2) => {
  const [p1, p2, p3, p4] = [P(r2, a1), P(r2, a2), P(r1, a2), P(r1, a1)];
  return `M${p1}A${r2},${r2} 0 0 1 ${p2}L${p3}A${r1},${r1} 0 0 0 ${p4}Z`;
};

function board() {
  let h =
    '<svg viewBox="-240 -240 480 480" style="width:100%;max-width:520px"><rect class="seg" x="-240" y="-240" width="480" height="480" fill="transparent" data-d="0" style="stroke:none;filter:none"/><circle r="232" fill="#111" data-d="0"/>';
  ORDER.forEach((n, i) => {
    const a1 = i * 18 - 9,
      a2 = i * 18 + 9,
      c = i % 2 ? ['#efe3bf', '#2a9d5c'] : ['#1b1b1b', '#d33'];
    [
      [28, 98, 'S', c[0]],
      [98, 122, 'T', c[1]],
      [122, 168, 'S', c[0]],
      [168, 196, 'D', c[1]],
    ].forEach(([r1, r2, t, f]) => {
      h += `<path class="seg" d="${arc(r1, r2, a1, a2)}" fill="${f}" data-d="${t}${n}"/>`;
    });
    const [x, y] = P(215, i * 18);
    h += `<text x="${x}" y="${y + 6}" text-anchor="middle" fill="#fff" font-size="18" font-weight="600" style="pointer-events:none">${n}</text>`;
  });
  return (
    h +
    '<circle class="seg" r="28" fill="#2a9d5c" data-d="25"/><circle class="seg" r="12" fill="#d33" data-d="50"/></svg>'
  );
}

const BOARD = board();
