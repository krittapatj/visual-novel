import { LoaderCircle } from "lucide-react";

export default function LoadingState({ message = "Loading...", description = "", fullPage = false, className = "" }) {
  return (
    <div role="status" aria-live="polite" className={`flex min-w-0 flex-col items-center justify-center gap-3 px-4 py-12 text-center ${fullPage ? "min-h-[60vh]" : "min-h-[180px]"} ${className}`}>
      <LoaderCircle size={32} aria-hidden="true" className="animate-spin text-purple-400 motion-reduce:animate-none" />
      <p className="break-words text-sm font-medium text-gray-200 sm:text-base">{message}</p>
      {description && <p className="max-w-md break-words text-sm text-gray-400">{description}</p>}
    </div>
  );
}
