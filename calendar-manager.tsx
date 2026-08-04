"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { canManageCalendar, roleLabel } from "@/lib/auth/permissions";
import { validateGigInput } from "@/lib/calendar/validation";
import type { Gig, GigInput, UserRole } from "@/lib/types";

type EditorState = { mode: "create"; gig: null } | { mode: "edit"; gig: Gig } | null;

interface CalendarManagerProps {
  initialGigs: Gig[];
  role: UserRole;
  dataSource: "demo" | "supabase";
}

const emptyGig: GigInput = {
  title: "",
  venue: "",
  address: "",
  startsAt: "",
  callTime: "",
  notes: "",
  status: "confirmed",
};

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function useDialogBehavior(open: boolean, close: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("button, input, select, textarea")?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);
  return dialogRef;
}

export function CalendarManager({ initialGigs, role, dataSource }: CalendarManagerProps) {
  const [gigs, setGigs] = useState(initialGigs);
  const [editor, setEditor] = useState<EditorState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Gig | null>(null);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mayManage = canManageCalendar(role);
  const sortedGigs = useMemo(
    () => [...gigs].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
    [gigs],
  );

  useEffect(() => {
    if (dataSource !== "demo") return;
    const saved = window.localStorage.getItem("ktbh-demo-gigs");
    if (!saved) return;
    try { setGigs(JSON.parse(saved) as Gig[]); } catch { window.localStorage.removeItem("ktbh-demo-gigs"); }
  }, [dataSource]);

  function updateGigs(next: Gig[]) {
    setGigs(next);
    if (dataSource === "demo") window.localStorage.setItem("ktbh-demo-gigs", JSON.stringify(next));
  }

  function announce(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3500);
  }

  async function saveGig(input: GigInput) {
    if (!mayManage || !editor) return;
    setBusy(true);
    try {
      if (editor.mode === "edit") {
        let updated: Gig = { ...editor.gig, ...input, updatedAt: new Date().toISOString() };
        if (dataSource === "supabase") {
          const response = await fetch(`/api/gigs/${editor.gig.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          });
          if (!response.ok) throw new Error(await errorMessage(response));
          updated = (await response.json()).gig as Gig;
        }
        updateGigs(gigs.map((gig) => (gig.id === updated.id ? updated : gig)));
        announce(`${updated.title} was updated.`);
      } else {
        let created: Gig = { ...input, id: crypto.randomUUID(), updatedAt: new Date().toISOString() };
        if (dataSource === "supabase") {
          const response = await fetch("/api/gigs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          });
          if (!response.ok) throw new Error(await errorMessage(response));
          created = (await response.json()).gig as Gig;
        }
        updateGigs([...gigs, created]);
        announce(`${created.title} was added.`);
      }
      setErrors({});
      setEditor(null);
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "The event could not be saved." });
    } finally {
      setBusy(false);
    }
  }

  async function deleteGig() {
    if (!mayManage || !deleteTarget) return;
    setBusy(true);
    try {
      if (dataSource === "supabase") {
        const response = await fetch(`/api/gigs/${deleteTarget.id}`, { method: "DELETE" });
        if (!response.ok) throw new Error(await errorMessage(response));
      }
      updateGigs(gigs.filter((gig) => gig.id !== deleteTarget.id));
      announce(`${deleteTarget.title} was deleted.`);
      setDeleteTarget(null);
    } catch (error) {
      announce(error instanceof Error ? error.message : "The event could not be deleted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="calendar-toolbar">
        <span className="role-chip" data-testid="current-role">Viewing as {roleLabel(role)}</span>
        {mayManage && (
          <button className="button button-primary" type="button" onClick={() => { setErrors({}); setEditor({ mode: "create", gig: null }); }}>
            <span aria-hidden="true">＋</span> Add event
          </button>
        )}
      </div>

      {!mayManage && (
        <div className="info-banner" role="status">
          Your role can view the shared calendar. Only administrators and bandleaders can add, edit, or delete events.
        </div>
      )}

      <section className="calendar-list" aria-label="Upcoming events">
        {sortedGigs.length ? sortedGigs.map((gig) => (
          <article className="gig-card" key={gig.id} data-testid={`gig-${gig.id}`}>
            <div className="gig-topline">
              <time className="gig-date" dateTime={gig.startsAt}>
                <span>{new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(gig.startsAt))}</span>
                <strong>{new Date(gig.startsAt).getDate()}</strong>
              </time>
              <div className="gig-title">
                <h2>{gig.title}</h2>
                <p>{gig.venue}</p>
              </div>
              <span className={`status status-${gig.status}`}>{gig.status}</span>
            </div>
            <div className="gig-details">
              <div><strong>Call:</strong> {formatTime(gig.callTime)}</div>
              <div><strong>Show:</strong> {formatTime(gig.startsAt)}</div>
              {gig.address && <div><strong>Address:</strong> {gig.address}</div>}
            </div>
            {gig.notes && <p className="gig-notes">{gig.notes}</p>}
            {mayManage && (
              <div className="gig-actions" aria-label={`Actions for ${gig.title}`}>
                <button className="button button-secondary button-compact" type="button" onClick={() => { setErrors({}); setEditor({ mode: "edit", gig }); }}>
                  Edit event
                </button>
                <button className="button button-danger-subtle button-compact" type="button" onClick={() => setDeleteTarget(gig)}>
                  Delete
                </button>
              </div>
            )}
          </article>
        )) : <div className="empty-state">No events are currently on the calendar.</div>}
      </section>

      {editor && (
        <EventDialog
          editor={editor}
          busy={busy}
          errors={errors}
          onClose={() => { if (!busy) setEditor(null); }}
          onSave={saveGig}
          setErrors={setErrors}
        />
      )}

      {deleteTarget && (
        <DeleteDialog
          gig={deleteTarget}
          busy={busy}
          onClose={() => { if (!busy) setDeleteTarget(null); }}
          onConfirm={deleteGig}
        />
      )}

      {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}
    </>
  );
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || "The request failed.";
  } catch { return "The request failed."; }
}

interface EventDialogProps {
  editor: Exclude<EditorState, null>;
  busy: boolean;
  errors: Record<string, string>;
  onClose: () => void;
  onSave: (input: GigInput) => Promise<void>;
  setErrors: (errors: Record<string, string>) => void;
}

function EventDialog({ editor, busy, errors, onClose, onSave, setErrors }: EventDialogProps) {
  const dialogRef = useDialogBehavior(true, onClose);
  const initial = editor.mode === "edit" ? editor.gig : emptyGig;

  async function submit(formData: FormData) {
    const result = validateGigInput(Object.fromEntries(formData.entries()));
    if (!result.data) { setErrors(result.errors); return; }
    await onSave(result.data);
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target && !busy) onClose(); }}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="event-dialog-title" ref={dialogRef}>
        <div className="dialog-header">
          <div>
            <h2 id="event-dialog-title">{editor.mode === "edit" ? "Edit calendar event" : "Add calendar event"}</h2>
            <p>Times are shown in the band’s local time zone.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close event editor" disabled={busy}>✕</button>
        </div>
        <form action={submit} noValidate>
          <div className="form-grid">
            <Field label="Event name" name="title" defaultValue={initial.title} error={errors.title} required />
            <Field label="Venue" name="venue" defaultValue={initial.venue} error={errors.venue} required />
            <Field label="Address" name="address" defaultValue={initial.address} error={errors.address} />
            <div className="form-row">
              <Field label="Call time" name="callTime" type="datetime-local" defaultValue={initial.callTime.slice(0, 16)} error={errors.callTime} required />
              <Field label="Show time" name="startsAt" type="datetime-local" defaultValue={initial.startsAt.slice(0, 16)} error={errors.startsAt} required />
            </div>
            <div className="field">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue={initial.status}>
                <option value="confirmed">Confirmed</option><option value="hold">Hold</option><option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="notes">Itinerary notes</label>
              <textarea id="notes" name="notes" defaultValue={initial.notes} maxLength={2000} />
            </div>
          </div>
          {errors.form && <p className="field-error" role="alert">{errors.form}</p>}
          <div className="dialog-actions">
            <button className="button button-secondary" type="button" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="button button-primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Save event"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, defaultValue, error, type = "text", required = false }: { label: string; name: string; defaultValue: string; error?: string; type?: string; required?: boolean }) {
  const errorId = `${name}-error`;
  return (
    <div className="field">
      <label htmlFor={name}>{label}{required ? " *" : ""}</label>
      <input id={name} name={name} type={type} defaultValue={defaultValue} required={required} maxLength={type === "text" ? 240 : undefined} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} />
      {error && <p className="field-error" id={errorId}>{error}</p>}
    </div>
  );
}

function DeleteDialog({ gig, busy, onClose, onConfirm }: { gig: Gig; busy: boolean; onClose: () => void; onConfirm: () => void }) {
  const dialogRef = useDialogBehavior(true, onClose);
  return (
    <div className="dialog-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target && !busy) onClose(); }}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-dialog-title" aria-describedby="delete-dialog-description" ref={dialogRef}>
        <div className="dialog-header">
          <div><h2 id="delete-dialog-title">Delete calendar event?</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close delete confirmation" disabled={busy}>✕</button>
        </div>
        <p className="delete-copy" id="delete-dialog-description">
          <strong>{gig.title}</strong> will be removed from the shared calendar. This action is recorded in the audit history and cannot be undone from this screen.
        </p>
        <div className="dialog-actions">
          <button className="button button-secondary" type="button" onClick={onClose} disabled={busy}>Keep event</button>
          <button className="button button-danger" type="button" onClick={onConfirm} disabled={busy}>{busy ? "Deleting…" : "Delete event"}</button>
        </div>
      </div>
    </div>
  );
}
