import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useStore } from "../scene/store";
import type { NoteElement, Participant } from "../scene/types";
import { useDragElement } from "./useDragElement";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

export function StickyNote({
  note,
  author,
  selected,
  editing,
  dimmed,
  interactive,
}: {
  note: NoteElement;
  author: Participant | undefined;
  selected: boolean;
  editing: boolean;
  dimmed: boolean;
  interactive: boolean;
}) {
  const drag = useDragElement(note.id, note.x, note.y);
  const color = author?.color ?? "#E9E4DA";
  const ink = author?.ink ?? "#4A4036";
  const name = author?.name ?? "Guest";
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      const t = textRef.current;
      t?.focus();
      t?.setSelectionRange(t.value.length, t.value.length);
    }
  }, [editing]);

  const finish = () => {
    const s = useStore.getState();
    const current = s.scene.elements.find((e) => e.id === note.id);
    s.setEditing(null);
    if (current && current.kind === "note" && !current.text.trim()) {
      // An empty note falls off the door; this removal is not worth an undo step of its own.
      useStore.setState((st) => ({
        scene: { ...st.scene, elements: st.scene.elements.filter((e) => e.id !== note.id) },
        selectedId: null,
      }));
    }
  };

  return (
    <div
      className={
        "note" + (selected ? " is-selected" : "") + (dimmed ? " is-dimmed" : "") + (interactive ? "" : " is-passive")
      }
      style={{ left: note.x, top: note.y, zIndex: note.z }}
      {...drag}
      onDoubleClick={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        const s = useStore.getState();
        s.checkpoint();
        s.setEditing(note.id);
      }}
    >
      <div className="note-tilt" style={{ transform: `rotate(${note.tilt}deg)` }}>
        <div className="note-curl note-curl-l" />
        <div className="note-curl note-curl-r" />
        <div className="note-paper" style={{ background: color }}>
          <div className="note-glue" />
          <div className="note-sheen" />
          {editing ? (
            <textarea
              ref={textRef}
              className="note-text note-input"
              aria-label="Note text"
              placeholder="Write an idea…"
              value={note.text}
              onChange={(e) => useStore.getState().patch(note.id, { text: e.target.value })}
              onBlur={finish}
              onKeyDown={(e) => {
                if ((e.key === "Enter" && !e.shiftKey) || e.key === "Escape") {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
              onPointerDown={(e) => e.stopPropagation()}
            />
          ) : (
            <p className="note-text">{note.text}</p>
          )}
          <div className="note-foot">
            <span className="note-author">
              <span className="avatar avatar-xs" style={{ background: ink }}>
                {name.charAt(0).toUpperCase()}
              </span>
              {name}
            </span>
            <span>{formatDate(note.createdAt)}</span>
          </div>
        </div>
        {selected && !editing && interactive && (
          <button
            type="button"
            className="note-delete"
            aria-label="Delete note"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => useStore.getState().remove(note.id)}
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}
