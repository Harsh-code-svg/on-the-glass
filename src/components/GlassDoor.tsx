import type { GlassKind, Participant } from "../scene/types";

/** Everything behind and on the glass: the blurred office, silhouettes, frost, grain, reflections, condensation. */
export function GlassBack({
  glass,
  participants,
  nearId,
}: {
  glass: GlassKind;
  participants: Participant[];
  /** Participant whose silhouette steps closer to the door (they are writing). */
  nearId: string | null;
}) {
  const n = Math.max(participants.length, 1);
  return (
    <>
      <div className="room" aria-hidden="true">
        <div className="room-light" />
        <div className="room-window" />
        <div className="room-shelf" />
        <div className="room-desks" />
        <div className="room-plant" />
        {participants.map((p, i) => {
          const near = p.id === nearId;
          const cx = 140 + ((i + 0.5) / n) * 1160 + (i % 2 ? 30 : -30);
          return <Silhouette key={p.id} cx={cx} near={near} />;
        })}
      </div>
      <div className={"frost frost-" + glass} aria-hidden="true" />
      <svg className="grain" aria-hidden="true" width="1352" height="812" viewBox="0 0 1352 812">
        <filter id="frostGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="1352" height="812" filter="url(#frostGrain)" />
      </svg>
      <div className="reflections" aria-hidden="true" />
      <svg className="condensation" aria-hidden="true" width="1352" height="812" viewBox="0 0 1352 812">
        <defs>
          <pattern id="droplets" width="37" height="29" patternUnits="userSpaceOnUse">
            <circle cx="4" cy="5" r="1.6" fill="rgba(255,255,255,0.7)" />
            <circle cx="17" cy="3" r="0.9" fill="rgba(255,255,255,0.6)" />
            <circle cx="27" cy="11" r="2.2" fill="rgba(255,255,255,0.55)" />
            <circle cx="10" cy="17" r="1.1" fill="rgba(255,255,255,0.65)" />
            <circle cx="33" cy="23" r="1.3" fill="rgba(255,255,255,0.6)" />
            <circle cx="21" cy="24" r="0.8" fill="rgba(255,255,255,0.7)" />
            <circle cx="2" cy="26" r="1.9" fill="rgba(255,255,255,0.5)" />
          </pattern>
        </defs>
        <rect width="1352" height="812" fill="url(#droplets)" />
      </svg>
      <div className="smudge" style={{ left: 560, top: 410, width: 150, height: 90, transform: "rotate(-14deg)" }} />
      <div className="smudge" style={{ left: 790, top: 330, width: 120, height: 160, transform: "rotate(10deg)" }} />
      <div className="print" style={{ left: 628, top: 392, transform: "rotate(-22deg)" }} />
      <div className="print" style={{ left: 640, top: 438, transform: "rotate(-12deg)" }} />
      <div className="print" style={{ left: 794, top: 420, transform: "rotate(18deg)" }} />
    </>
  );
}

function Silhouette({ cx, near }: { cx: number; near: boolean }) {
  const w = near ? 190 : 112;
  return (
    <div
      className="silhouette"
      style={{
        left: cx - w / 2,
        top: near ? 210 : 290,
        width: w,
        filter: `blur(${near ? 7 : 12}px)`,
        opacity: near ? 0.8 : 0.64,
      }}
    >
      <div className="silhouette-head" style={{ width: near ? 80 : 47, height: near ? 92 : 55 }} />
      <div
        className="silhouette-body"
        style={{ width: w, height: near ? 520 : 250, borderRadius: `${w / 2}px ${w / 2}px 12px 12px` }}
      />
    </div>
  );
}

/** Frame, centre seam and handles: they sit in front of everything written on the glass. */
export function DoorHardware() {
  return (
    <div className="hardware" aria-hidden="true">
      <div className="frame" />
      <div className="seam" />
      <div className="handle" style={{ left: 666 }} />
      <div className="handle" style={{ left: 760 }} />
    </div>
  );
}
