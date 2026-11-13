import { memo } from "react";
import type { Participant } from "../scene/types";

/**
 * The office behind the glass, drawn in one-point perspective.
 * Coordinates are in glass space (1352 × 812); the CSS blurs it like a camera's depth of field.
 */
const W = 1352;
const H = 812;
const BACK = { x0: 392, x1: 960, y0: 250, y1: 478 };
const CX = W / 2;
const HALF_BACK = (BACK.x1 - BACK.x0) / 2;

type P = [number, number];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** A point on the ceiling: u = -1 (left) … 1 (right), t = 0 (at the glass) … 1 (back wall). */
const ceil = (u: number, t: number): P => [lerp(CX + u * CX, CX + u * HALF_BACK, t), lerp(0, BACK.y0, t)];
/** A point on the floor. */
const floor = (u: number, t: number): P => [lerp(CX + u * CX, CX + u * HALF_BACK, t), lerp(H, BACK.y1, t)];
const pts = (ps: P[]) => ps.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
const quad = (f: (u: number, t: number) => P, u0: number, u1: number, t0: number, t1: number, lift = 0) =>
  pts([f(u0, t0), f(u1, t0), f(u1, t1), f(u0, t1)].map(([x, y]) => [x, y - lift] as P));

const LIGHT_ROWS = [0.1, 0.36, 0.55, 0.68, 0.77, 0.83];
const LIGHT_COLS = [-0.62, -0.2, 0.2, 0.62];
const DESK_ROWS = [0.76, 0.64, 0.5, 0.38];
const SKIN = ["#c99a7c", "#8d5f45", "#e2bfa3", "#a8775a", "#6f4a35", "#d7a98a"];
const HAIR = ["#2a1d17", "#3b2a1f", "#6b4a2b", "#1b1b1d", "#8a6a45", "#2d2622"];

function Person({
  x,
  footY,
  h,
  shirt,
  i,
}: {
  x: number;
  footY: number;
  h: number;
  shirt: string;
  i: number;
}) {
  const head = h * 0.13;
  const shoulders = h * 0.27;
  const torsoH = h * 0.36;
  const top = footY - h;
  return (
    <g>
      {/* legs */}
      <rect x={x - shoulders * 0.32} y={top + head * 2 + torsoH - 4} width={shoulders * 0.3} height={h * 0.45} rx={4} fill="#3a3d44" />
      <rect x={x + shoulders * 0.02} y={top + head * 2 + torsoH - 4} width={shoulders * 0.3} height={h * 0.45} rx={4} fill="#34373e" />
      {/* torso + arms */}
      <rect x={x - shoulders / 2} y={top + head * 1.9} width={shoulders} height={torsoH} rx={shoulders * 0.32} fill={shirt} />
      <rect x={x - shoulders / 2 - shoulders * 0.14} y={top + head * 2.1} width={shoulders * 0.2} height={torsoH * 0.9} rx={shoulders * 0.1} fill={shirt} />
      <rect x={x + shoulders / 2 - shoulders * 0.06} y={top + head * 2.1} width={shoulders * 0.2} height={torsoH * 0.9} rx={shoulders * 0.1} fill={shirt} />
      {/* head */}
      <ellipse cx={x} cy={top + head} rx={head * 0.78} ry={head} fill={SKIN[i % SKIN.length]} />
      <path
        d={`M${x - head * 0.82} ${top + head * 0.95} Q${x - head * 0.9} ${top - head * 0.15} ${x} ${top - head * 0.08} Q${x + head * 0.9} ${top - head * 0.15} ${x + head * 0.82} ${top + head * 0.95} Q${x} ${top + head * 0.35} ${x - head * 0.82} ${top + head * 0.95}Z`}
        fill={HAIR[i % HAIR.length]}
      />
    </g>
  );
}

/** Muted clothing colour derived from a participant's colour. */
const shirtFor = (p: Participant) => p.ink;

export const RoomFar = memo(function RoomFar({ participants, nearId }: { participants: Participant[]; nearId: string | null }) {
  const far = participants.filter((p) => p.id !== nearId);
  return (
    <svg className="room-svg room-far" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <defs>
        <linearGradient id="rCeil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dfe3e4" />
          <stop offset="1" stopColor="#eceeee" />
        </linearGradient>
        <linearGradient id="rFloor" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#9d9488" />
          <stop offset="1" stopColor="#c9c2b7" />
        </linearGradient>
        <linearGradient id="rSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f8fa" />
          <stop offset="1" stopColor="#e1eaef" />
        </linearGradient>
        <linearGradient id="rRight" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#eef4f6" />
          <stop offset="1" stopColor="#fbfdfd" />
        </linearGradient>
        <linearGradient id="rLeft" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#d6d9d6" />
          <stop offset="1" stopColor="#c8ccc9" />
        </linearGradient>
        <radialGradient id="rBloom" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* room box */}
      <polygon points={pts([[0, 0], [W, 0], [BACK.x1, BACK.y0], [BACK.x0, BACK.y0]])} fill="url(#rCeil)" />
      <polygon points={pts([[0, 0], [BACK.x0, BACK.y0], [BACK.x0, BACK.y1], [0, H]])} fill="url(#rLeft)" />
      <polygon points={pts([[W, 0], [BACK.x1, BACK.y0], [BACK.x1, BACK.y1], [W, H]])} fill="url(#rRight)" />
      <polygon points={pts([[0, H], [W, H], [BACK.x1, BACK.y1], [BACK.x0, BACK.y1]])} fill="url(#rFloor)" />
      <rect x={BACK.x0} y={BACK.y0} width={BACK.x1 - BACK.x0} height={BACK.y1 - BACK.y0} fill="#e2e5e3" />

      {/* back window with the city outside */}
      <rect x={BACK.x0 + 24} y={BACK.y0 + 16} width={BACK.x1 - BACK.x0 - 48} height={164} fill="url(#rSky)" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
        <rect
          key={k}
          x={BACK.x0 + 34 + k * 66}
          y={BACK.y0 + 180 - (40 + ((k * 37) % 70))}
          width={48 + ((k * 13) % 20)}
          height={40 + ((k * 37) % 70)}
          fill={k % 2 ? "#c9d3d9" : "#bcc7ce"}
        />
      ))}
      <ellipse cx={BACK.x0 + 120} cy={BACK.y0 + 170} rx={70} ry={26} fill="#a3b896" />
      <ellipse cx={BACK.x1 - 140} cy={BACK.y0 + 172} rx={90} ry={22} fill="#9fb592" />
      {[0, 1, 2, 3, 4, 5, 6].map((k) => (
        <rect key={k} x={BACK.x0 + 22 + k * 87} y={BACK.y0 + 16} width={4} height={164} fill="#9aa1a6" />
      ))}
      <rect x={BACK.x0 + 24} y={BACK.y0 + 60} width={BACK.x1 - BACK.x0 - 48} height={3} fill="#9aa1a6" />
      <rect x={BACK.x0 + 20} y={BACK.y0 + 178} width={BACK.x1 - BACK.x0 - 40} height={6} fill="#b7bcbf" />

      {/* right wall: floor-to-ceiling windows */}
      {[0.08, 0.3, 0.55, 0.82].map((s, k) => {
        const top = [lerp(BACK.x1, W, s), lerp(BACK.y0, 0, s)] as P;
        const bottom = [lerp(BACK.x1, W, s), lerp(BACK.y1, H, s)] as P;
        const w = 4 + s * 14;
        return <rect key={k} x={top[0] - w / 2} y={top[1]} width={w} height={bottom[1] - top[1]} fill="#8f969b" />;
      })}
      <polygon
        points={pts([[BACK.x1, BACK.y1 - 70], [W, H - 250], [W, H - 190], [BACK.x1, BACK.y1 - 50]])}
        fill="#a9b99c"
        opacity="0.7"
      />
      <polygon points={pts([[BACK.x1, BACK.y1 - 16], [W, H - 60], [W, H], [BACK.x1, BACK.y1]])} fill="#b9b3a9" />

      {/* left wall: a pinboard and a door */}
      <polygon points={pts([[90, 220], [250, 255], [250, 395], [90, 420]])} fill="#e9e6df" stroke="#b9b5ad" strokeWidth={4} />
      <polygon points={pts([[300, 252], [360, 262], [360, 470], [300, 500]])} fill="#cfc9bf" />

      {/* ceiling lights */}
      {LIGHT_ROWS.map((t, r) =>
        LIGHT_COLS.map((u, c) => {
          const dt = 0.03 * (1 - t) + 0.008;
          return <polygon key={`${r}-${c}`} points={quad(ceil, u - 0.11, u + 0.11, t - dt, t + dt)} fill="#ffffff" />;
        }),
      )}
      {LIGHT_ROWS.slice(0, 3).map((t, r) => (
        <ellipse key={r} cx={CX} cy={ceil(0, t)[1] + 18} rx={W * (1 - t) * 0.42} ry={40 * (1 - t) + 8} fill="url(#rBloom)" opacity={0.5} />
      ))}

      {/* desks, monitors and chairs, far to near */}
      {DESK_ROWS.map((t, r) => {
        const depth = 0.07;
        const lift = (1 - t) * 105 + 22;
        return [-1, 1].map((side) => {
          const u0 = side < 0 ? -0.95 : 0.36;
          const u1 = side < 0 ? -0.36 : 0.95;
          const front0 = floor(u0, t);
          const front1 = floor(u1, t);
          const monW = (1 - t) * 74 + 22;
          const monH = (1 - t) * 50 + 14;
          return (
            <g key={`${r}-${side}`}>
              <polygon points={pts([front0, front1, [front1[0], front1[1] - lift], [front0[0], front0[1] - lift]])} fill="#cfcbc4" />
              <polygon points={quad(floor, u0, u1, t, t + depth, lift)} fill="#f2f0eb" />
              {[0.2, 0.5, 0.8].map((k) => {
                const [mx, my] = floor(lerp(u0, u1, k), t + depth * 0.8);
                return (
                  <g key={k}>
                    <rect x={mx - monW / 2} y={my - lift - monH - 6} width={monW} height={monH} rx={2} fill="#24282c" />
                    <rect x={mx - monW / 2 + 3} y={my - lift - monH - 3} width={monW - 6} height={monH - 6} fill="#3b4a58" opacity="0.7" />
                    <rect x={mx - 2} y={my - lift - 6} width={4} height={6} fill="#24282c" />
                  </g>
                );
              })}
              {[0.25, 0.75].map((k) => {
                const [cx, cy] = floor(lerp(u0, u1, k), t - 0.04);
                const s = (1 - t) * 60 + 20;
                return <rect key={k} x={cx - s / 2} y={cy - lift - s * 0.4} width={s} height={s * 1.1} rx={s * 0.25} fill="#2f3337" />;
              })}
            </g>
          );
        });
      })}

      {/* people across the room: one per participant */}
      {far.map((p, i) => {
        const n = Math.max(far.length, 1);
        const u = lerp(-0.7, 0.7, n === 1 ? 0.35 : i / (n - 1)) + (i % 2 ? 0.05 : -0.05);
        const t = [0.62, 0.72, 0.57, 0.69, 0.65, 0.76, 0.6, 0.74][i % 8];
        const [x, y] = floor(u, t);
        return <Person key={p.id} x={x} footY={y} h={(1 - t) * 380 + 70} shirt={shirtFor(p)} i={i} />;
      })}

      {/* plants */}
      <g>
        <rect x={1150} y={600} width={70} height={120} rx={8} fill="#e8e6e1" />
        <ellipse cx={1185} cy={540} rx={95} ry={110} fill="#557d48" />
        <ellipse cx={1135} cy={500} rx={60} ry={70} fill="#6d9858" />
        <ellipse cx={1235} cy={480} rx={55} ry={75} fill="#4c7442" />
        <ellipse cx={1190} cy={430} rx={50} ry={60} fill="#7aa463" />
      </g>
      <g>
        <rect x={150} y={470} width={44} height={70} rx={6} fill="#e8e6e1" />
        <ellipse cx={172} cy={430} rx={60} ry={64} fill="#5f8a4e" />
        <ellipse cx={140} cy={400} rx={36} ry={44} fill="#77a061" />
      </g>
    </svg>
  );
});

/** The participant who is writing walks right up to the door. */
export function RoomNear({ person, index }: { person: Participant | null; index: number }) {
  if (!person) return null;
  return (
    <svg className="room-svg room-near" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <Person x={1040} footY={H + 120} h={620} shirt={shirtFor(person)} i={index} />
    </svg>
  );
}
