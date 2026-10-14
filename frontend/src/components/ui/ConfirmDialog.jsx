import { useEffect, useId, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDialog({ open, title = "Confirm action", description = "", confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false, busy = false, onConfirm, onCancel }) {
  const cancelRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !busy) onCancel();
      if (event.key === "Tab") {
        const dialog = cancelRef.current?.closest('[role="dialog"]');
        const focusables = [...(dialog?.querySelectorAll('button:not(:disabled)') || [])];
        if (!focusables.length) return;
        const first = focusables[0], last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = previousOverflow; previous?.focus?.(); };
  }, [open, busy, onCancel]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/80 p-4">
      <section role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-white/15 bg-[#171725] p-5 text-white shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3"><AlertTriangle size={23} className={danger ? "shrink-0 text-red-400" : "shrink-0 text-purple-400"}/><h2 id={titleId} className="break-words text-lg font-semibold">{title}</h2></div>
          <button type="button" onClick={onCancel} disabled={busy} aria-label="Close dialog" className="rounded p-1 text-gray-400 hover:text-white disabled:opacity-50"><X size={20}/></button>
        </div>
        <p id={descriptionId} className="mt-4 whitespace-pre-line break-words text-sm text-gray-300">{description}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button ref={cancelRef} type="button" disabled={busy} onClick={onCancel} className="min-h-11 rounded-lg border border-white/20 px-5 py-2.5 text-sm hover:bg-white/10 disabled:opacity-50">{cancelLabel}</button>
          <button type="button" disabled={busy} onClick={onConfirm} className={`min-h-11 rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${danger ? "bg-red-600 hover:bg-red-500" : "bg-purple-600 hover:bg-purple-500"}`}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
