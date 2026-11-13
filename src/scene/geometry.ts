import { getStroke } from "perfect-freehand";
import type { SceneElement } from "./types";

/** perfect-freehand outline → SVG path (from the library's README). */
export function strokePath(points: [number, number, number][], size: number): string {
  const outline = getStroke(points, {
    size,
    thinning: 0.35,
    smoothing: 0.55,
    streamline: 0.45,
    simulatePressure: points.every((p) => p[2] === 0.5),
  });
  if (!outline.length) return "";
  const d = outline.reduce<(string | number)[]>(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...outline[0], "Q"],
  );
  d.push("Z");
  return d.map((v) => (typeof v === "number" ? Math.round(v * 10) / 10 : v)).join(" ");
}

/** Rough text box, good enough for erasing and hit-testing. */
export function textBox(text: string, size: number) {
  const lines = (text || " ").split("\n");
  const w = Math.max(...lines.map((l) => l.length)) * size * 0.52 + 8;
  const h = lines.length * size * 1.25;
  return { w, h };
}

/** Is a point on this element, within `pad` door units? (Notes are never erased.) */
export function hitsErasable(el: SceneElement, x: number, y: number, pad: number): boolean {
  if (el.kind === "stroke") {
    const r = el.size / 2 + pad;
    const r2 = r * r;
    return el.points.some(([px, py]) => (px - x) ** 2 + (py - y) ** 2 <= r2);
  }
  if (el.kind === "text") {
    const { w, h } = textBox(el.text, el.size);
    return x >= el.x - pad && x <= el.x + w + pad && y >= el.y - pad && y <= el.y + h + pad;
  }
  return false;
}
