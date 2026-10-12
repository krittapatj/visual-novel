import { Handle, Position } from "@xyflow/react";
import { Play, MessageSquare, GitBranch, Image, Flag } from "lucide-react";

const styles = {
  start: {
    icon: Play,
    color: "border-emerald-500/60",
    text: "text-emerald-300",
  },
  dialogue: {
    icon: MessageSquare,
    color: "border-purple-500/60",
    text: "text-purple-300",
  },
  choice: {
    icon: GitBranch,
    color: "border-amber-500/60",
    text: "text-amber-300",
  },
  scene: {
    icon: Image,
    color: "border-sky-500/60",
    text: "text-sky-300",
  },
  ending: {
    icon: Flag,
    color: "border-rose-500/60",
    text: "text-rose-300",
  },
};

export default function StoryNode({ data, selected }) {
  const nodeType = data.nodeType || "dialogue";
  const config = styles[nodeType] || styles.dialogue;
  const Icon = config.icon;

  const title = {
    start: data.label || "Start",
    dialogue: data.speaker || "Narrator",
    choice: data.question || "Choose...",
    scene: "Scene Change",
    ending: data.endingName || "Ending",
  }[nodeType];

  const detail = {
    start: "Story begins here",
    dialogue: data.text || "Empty dialogue",
    choice: `${data.options?.length || 0} options`,
    scene: data.backgroundUrl || "No background",
    ending: "End of this path",
  }[nodeType];

  return (
    <div
      className={`w-52 rounded-xl border-2 bg-[#171725] p-3 shadow-xl ${config.color} ${
        selected ? "ring-2 ring-white/40" : ""
      }`}
    >
      {nodeType !== "start" && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-3 !w-3 !bg-gray-300"
        />
      )}

      <div className={`mb-2 flex items-center gap-2 ${config.text}`}>
        <Icon size={16} />
        <span className="text-xs font-bold uppercase">{nodeType}</span>
      </div>

      <p className="truncate text-sm font-semibold text-white">{title}</p>

      <p className="mt-1 truncate text-xs text-gray-400">{detail}</p>

      {nodeType === "choice" ? (
        <div className="mt-3 space-y-3">
          {(data.options || []).map((option) => (
            <div
              key={option.id}
              className="relative rounded bg-amber-500/10 px-2 py-1.5 pr-4 text-xs text-amber-200"
            >
              <span className="block truncate">{option.text}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={option.id}
                className="!absolute !right-[-12px] !top-1/2 !h-3 !w-3 !-translate-y-1/2 !bg-amber-400"
              />
            </div>
          ))}
        </div>
      ) : nodeType !== "ending" ? (
        <Handle
          type="source"
          position={Position.Right}
          id="default"
          className="!h-3 !w-3 !bg-purple-400"
        />
      ) : null}
    </div>
  );
}
