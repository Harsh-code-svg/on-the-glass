import type { GlassKind, Participant } from "../scene/types";
import { RoomFar, RoomNear } from "./Room";

/** Left and right glass panels (door coordinates); the gap between them is the door seam. */
const PANELS = [
  { left: 44, width: 672 },
  { left: 724, width: 672 },
];

/** Everything behind and in the glass: the office, then tint, reflections, privacy strip and smudges. */
export function GlassBack({
  glass,
  participants,
  nearId,
}: {
  glass: GlassKind;
  participants: Participant[];
  nearId: string | null;
}) {
  const nearIndex = participants.findIndex((p) => p.id === nearId);
  return (
    <>
      <div className={"room room-" + glass} aria-hidden="true">
        <RoomFar participants={participants} nearId={nearId} />
        <RoomNear person={nearIndex >= 0 ? participants[nearIndex] : null} index={nearIndex} />
        <div className="room-light" />
      </div>

      {PANELS.map((p) => (
        <div key={p.left} className={"pane pane-" + glass} style={{ left: p.left, width: p.width }} aria-hidden="true">
          <div className="pane-tint" />
          <div className="pane-reflect" />
          <div className="pane-sheen" />
          <div className="pane-band" />
          <div className="pane-edge" />
        </div>
      ))}

      <div className="smudge" style={{ left: 600, top: 400, width: 110, height: 70, transform: "rotate(-14deg)" }} />
      <div className="smudge" style={{ left: 780, top: 340, width: 90, height: 130, transform: "rotate(10deg)" }} />
      <div className="print" style={{ left: 636, top: 396, transform: "rotate(-22deg)" }} />
      <div className="print" style={{ left: 648, top: 442, transform: "rotate(-12deg)" }} />
      <div className="print" style={{ left: 792, top: 424, transform: "rotate(18deg)" }} />
    </>
  );
}

/** Aluminium frame, chrome patch fittings and pull handles: they sit in front of everything on the glass. */
export function DoorHardware() {
  return (
    <div className="hardware" aria-hidden="true">
      <div className="rail rail-top" />
      <div className="rail rail-bottom" />
      <div className="rail rail-left" />
      <div className="rail rail-right" />
      <div className="seam-gap" />
      <div className="fitting" style={{ left: 652, top: 44 }} />
      <div className="fitting" style={{ left: 724, top: 44 }} />
      <div className="fitting" style={{ left: 652, top: 822 }} />
      <div className="fitting" style={{ left: 724, top: 822 }} />
      <Handle left={672} />
      <Handle left={754} />
    </div>
  );
}

function Handle({ left }: { left: number }) {
  return (
    <div className="handle" style={{ left }}>
      <div className="handle-post handle-post-top" />
      <div className="handle-post handle-post-bottom" />
      <div className="handle-bar" />
    </div>
  );
}
