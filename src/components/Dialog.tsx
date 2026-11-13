import { useEffect, useRef, useState } from "react";

/** Asks for the person's first name; it signs their notes. */
export function NameDialog({
  initial,
  onDone,
  onCancel,
}: {
  initial: string;
  onDone: (name: string) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => inputRef.current?.focus(), []);

  return (
    <div className="dialog-backdrop">
      <form
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="name-title"
        onSubmit={(e) => {
          e.preventDefault();
          const n = name.trim();
          if (n) onDone(n.slice(0, 24));
        }}
      >
        <h2 id="name-title">Who’s writing?</h2>
        <p>Your first name signs every note you stick on the glass.</p>
        <label className="field">
          <span>First name</span>
          <input ref={inputRef} value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
        </label>
        <div className="dialog-actions">
          {onCancel && (
            <button type="button" className="btn btn-ghost" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn" disabled={!name.trim()}>
            Step up to the door
          </button>
        </div>
      </form>
    </div>
  );
}

/** A small confirm dialog (used before wiping the door). */
export function ConfirmDialog({
  title,
  body,
  confirm,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirm: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => ref.current?.focus(), []);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onCancel]);

  return (
    <div className="dialog-backdrop">
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">{title}</h2>
        <p>{body}</p>
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button ref={ref} type="button" className="btn btn-danger" onClick={onConfirm}>
            {confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
