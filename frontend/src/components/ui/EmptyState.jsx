import { FolderOpen } from "lucide-react";

export default function EmptyState({ icon: Icon = FolderOpen, title = "No data found", description = "", action = null, className = "" }) {
  return (
    <div className={`flex min-w-0 flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#171725] px-4 py-12 text-center sm:px-6 sm:py-16 ${className}`}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10"><Icon size={28} aria-hidden="true" className="text-purple-400" /></div>
      <h2 className="break-words text-lg font-semibold text-white sm:text-xl">{title}</h2>
      {description && <p className="mt-2 max-w-md break-words text-sm text-gray-400 sm:text-base">{description}</p>}
      {action && <div className="mt-6 flex w-full justify-center sm:w-auto">{action}</div>}
    </div>
  );
}
