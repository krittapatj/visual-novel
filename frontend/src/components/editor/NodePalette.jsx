import {
  Play,
  MessageSquare,
  GitBranch,
  Image,
  Flag
} from 'lucide-react';

const items = [
  { type: 'start', label: 'Start', icon: Play },
  { type: 'dialogue', label: 'Dialogue', icon: MessageSquare },
  { type: 'choice', label: 'Choice', icon: GitBranch },
  { type: 'scene', label: 'Scene', icon: Image },
  { type: 'ending', label: 'Ending', icon: Flag }
];

export default function NodePalette({ onAdd }) {
  return (
    <aside className="w-full border-b border-white/10 bg-[#171725] p-4 lg:w-52 lg:border-b-0 lg:border-r">
      <h2 className="mb-4 font-semibold">Add Nodes</h2>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-1">
        {items.map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() => onAdd(item.type)}
            className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#10101b] px-3 py-3 text-left text-sm hover:border-purple-500"
          >
            <item.icon size={18} className="text-purple-400" />
            {item.label}
          </button>
        ))}
      </div>
    </aside>
  );
}