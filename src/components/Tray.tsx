import { Eraser, MousePointer2, Type } from "lucide-react";
import { useRef } from "react";
import { MARKERS } from "../scene/constants";
import { useStore } from "../scene/store";
import type { Tool } from "../scene/types";
import { useStage } from "./StageContext";

/**
 * The bottom bar: tools + markers, who's here, and the sticky pad.
 * Lives inside the door, so it scales with it.
 */
export function Tray({ onGhost }: { onGhost: (p: { x: number; y: number } | null) => void }) {
  const tool = useStore((s) => s.tool);
  const markerIndex = useStore((s) => s.markerIndex);
  const glass = useStore((s) => s.scene.door.glass);
  const participants = useStore((s) => s.scene.participants);
  const focusAuthor = useStore((s) => s.focusAuthor);
  const meId = useStore((s) => s.meId);
  const active = useStore((s) => s.active);
  const markers = MARKERS[glass];
  const me = participants.find((p) => p.id === meId);

  const toolBtn = (t: Tool, label: string, key: string, icon: React.ReactNode) => (
    <button
      type="button"
      className={"tray-tool" + (tool === t ? " is-on" : "")}
      aria-label={`${label} (${key})`}
      aria-pressed={tool === t}
      title={`${label} — ${key}`}
      onClick={() => useStore.getState().setTool(t)}
    >
      {icon}
    </button>
  );

  return (
    <div className="tray" onPointerDown={(e) => e.stopPropagation()}>
      <div className="tray-group" role="group" aria-label="Tools">
        {toolBtn("select", "Select and move", "V", <MousePointer2 size={20} />)}
        <div className="tray-markers" role="group" aria-label="Markers">
          {markers.map((m, i) => {
            const on = tool === "marker" && markerIndex === i;
            return (
              <button
                key={m.name}
                type="button"
                className={"marker" + (on ? " is-on" : "")}
                aria-label={`${m.name} marker (${i + 1})`}
                aria-pressed={on}
                title={`${m.name} marker — ${i + 1}`}
                onClick={() => useStore.getState().setMarkerIndex(i)}
              >
                <span className="marker-body" style={{ background: m.color }}>
                  <span className="marker-tip" style={{ background: m.color }} />
                </span>
              </button>
            );
          })}
        </div>
        {toolBtn("text", "Write text", "T", <Type size={20} />)}
        {toolBtn("eraser", "Wipe marker", "E", <Eraser size={20} />)}
      </div>

      <div className="tray-divider" />

      <div className="tray-group tray-faces" role="group" aria-label="Participants — tap a face to highlight their notes">
        {participants.map((p) => {
          const on = focusAuthor === p.id;
          return (
            <button
              key={p.id}
              type="button"
              className={"face" + (on ? " is-on" : "") + (focusAuthor && !on ? " is-dim" : "")}
              style={{ background: p.ink, boxShadow: on ? undefined : `0 0 0 2px ${p.color}` }}
              aria-label={`Show ${p.name}’s notes${p.id === meId ? " (you)" : ""}`}
              aria-pressed={on}
              title={p.id === meId ? `${p.name} (you)` : p.name}
              onClick={() => useStore.getState().toggleFocus(p.id)}
            >
              {p.name.charAt(0).toUpperCase()}
              {p.id === meId && active && (
                <span className="face-badge" aria-hidden="true">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="tray-divider" />

      <Pad color={me?.color ?? "#FFE27A"} onGhost={onGhost} />
    </div>
  );
}

function Pad({ color, onGhost }: { color: string; onGhost: (p: { x: number; y: number } | null) => void }) {
  const { toDoor } = useStage();
  const drag = useRef<{ sx: number; sy: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  return (
    <button
      type="button"
      className="pad"
      aria-label="New sticky note — drag it onto the glass, or press N"
      title="Drag a note onto the glass — N"
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        const p = toDoor(e.clientX, e.clientY);
        drag.current = { sx: p.x, sy: p.y, moved: false };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const p = toDoor(e.clientX, e.clientY);
        if (!d.moved && Math.abs(p.x - d.sx) + Math.abs(p.y - d.sy) > 6) d.moved = true;
        if (d.moved) onGhost(p);
      }}
      onPointerUp={(e) => {
        const d = drag.current;
        drag.current = null;
        onGhost(null);
        if (!d?.moved) return;
        suppressClick.current = true;
        const p = toDoor(e.clientX, e.clientY);
        useStore.getState().addNote(p.x, p.y);
      }}
      onPointerCancel={() => {
        drag.current = null;
        onGhost(null);
      }}
      onClick={() => {
        if (suppressClick.current) {
          suppressClick.current = false;
          return;
        }
        addNoteInOpenSpot();
      }}
    >
      <span className="pad-sheet pad-sheet-3" style={{ background: color }} />
      <span className="pad-sheet pad-sheet-2" style={{ background: color }} />
      <span className="pad-sheet pad-sheet-1" style={{ background: color }}>+</span>
    </button>
  );
}

/** Keyboard / click: place a note somewhere near the middle of the left door, nudged so notes don't stack exactly. */
export function addNoteInOpenSpot() {
  const n = useStore.getState().scene.elements.filter((e) => e.kind === "note").length;
  useStore.getState().addNote(380 + (n % 5) * 28, 430 + (n % 5) * 18 - 40);
}
