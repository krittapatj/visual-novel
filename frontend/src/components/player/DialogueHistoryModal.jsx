import { useEffect, useRef } from "react";
import { History, X, MessageSquareText } from "lucide-react";

export default function DialogueHistoryModal({ open, entries = [], onClose }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, entries.length]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="dialogue-history-title" className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#171725] text-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <History size={22} className="text-purple-400" />
            <div>
              <h2 id="dialogue-history-title" className="font-semibold">Dialogue History</h2>
              <p className="text-xs text-gray-400">บทสนทนาที่ผ่านมาในบทปัจจุบัน</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialogue history" className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white"><X size={20} /></button>
        </header>
        <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center text-gray-400">
              <MessageSquareText size={32} />
              <p>ยังไม่มีบทสนทนาในประวัติ</p>
            </div>
          ) : entries.map((entry, index) => (
            <div key={`${entry.nodeId}-${index}`} className="rounded-xl border border-white/10 bg-[#211d32] p-4">
              <p className="mb-1 text-sm font-semibold text-purple-300">{entry.speaker || "Narrator"}</p>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-100">{entry.text}</p>
            </div>
          ))}
        </div>
        <footer className="border-t border-white/10 px-5 py-3 text-right text-xs text-gray-400">{entries.length} ข้อความ</footer>
      </section>
    </div>
  );
}
