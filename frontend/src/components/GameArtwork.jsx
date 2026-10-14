import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
const API_ORIGIN = new URL(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').origin;
export function imageUrl(path) {
  if (!path) return '';
  try {
    const url = new URL(path, API_ORIGIN);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}
export default function GameArtwork({ primary, fallback, alt, className = '', iconSize = 52 }) {
  const [failed, setFailed] = useState(false);
  const primaryUrl = imageUrl(primary);
  const fallbackUrl = imageUrl(fallback);
  const url = failed && primaryUrl !== fallbackUrl ? fallbackUrl : (failed ? '' : primaryUrl || fallbackUrl);
  const [secondFailed, setSecondFailed] = useState(false);
  useEffect(() => { setFailed(false); setSecondFailed(false); }, [primary, fallback]);
  return url && !secondFailed ? (
    <img src={url} alt={alt} className={className} onError={() => {
      if (!failed && primaryUrl && fallbackUrl && primaryUrl !== fallbackUrl) setFailed(true);
      else setSecondFailed(true);
    }} />
  ) : <div className="flex h-full w-full items-center justify-center text-purple-300/60"><BookOpen size={iconSize} aria-label="No game image" /></div>;
}
