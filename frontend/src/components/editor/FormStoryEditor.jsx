import {
  Play,
  MessageSquare,
  GitBranch,
  Image,
  Flag,
  ArrowRight
} from 'lucide-react';

const icons = {
  start: Play,
  dialogue: MessageSquare,
  choice: GitBranch,
  scene: Image,
  ending: Flag
};

export default function FormStoryEditor({
  nodes,
  edges,
  selectedNodeId,
  onSelect,
  onConnect,
  onAdd
}) {
  const getNodeTitle = (node) => {
    const data = node.data;

    return (
      data.speaker ||
      data.question ||
      data.sceneName ||
      data.endingName ||
      data.label ||
      node.data.nodeType
    );
  };

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">
            Story Structure
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Select a node to edit its content and connections.
          </p>
        </div>

        <button
          onClick={() => onAdd('dialogue')}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm"
        >
          + Add Dialogue
        </button>
      </div>

      <div className="space-y-3">
        {nodes.map((node) => {
          const type = node.data.nodeType;
          const Icon = icons[type] || MessageSquare;

          const outgoing = edges.filter(
            (edge) => edge.source === node.id
          );

          const handles = type === 'choice'
            ? node.data.options || []
            : type === 'ending'
              ? []
              : [{ id: 'default', text: 'Next' }];

          return (
            <div
              key={node.id}
              className={`rounded-xl border bg-[#171725] p-4 ${
                selectedNodeId === node.id
                  ? 'border-purple-500'
                  : 'border-white/10'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(node.id)}
                className="flex w-full items-center gap-3 text-left"
              >
                <Icon size={20} className="text-purple-400" />

                <div className="min-w-0">
                  <p className="text-xs uppercase text-gray-500">
                    {type}
                  </p>
                  <p className="truncate font-semibold">
                    {getNodeTitle(node)}
                  </p>
                </div>
              </button>

              {handles.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                  {handles.map((handle) => {
                    const current = outgoing.find(
                      (edge) => edge.sourceHandle === handle.id
                    );

                    return (
                      <div key={handle.id} className="flex items-center gap-2">
                        <span className="w-20 truncate text-xs text-gray-400">
                          {handle.text}
                        </span>

                        <ArrowRight size={14} className="text-gray-500" />

                        <select
                          aria-label={`Destination for ${handle.text}`}
                          value={current?.target || ''}
                          onChange={(e) =>
                            onConnect(
                              node.id,
                              handle.id,
                              e.target.value
                            )
                          }
                          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#10101b] px-3 py-2 text-sm"
                        >
                          <option value="">No connection</option>

                          {nodes
                            .filter(
                              (target) =>
                                target.id !== node.id &&
                                target.data.nodeType !== 'start'
                            )
                            .map((target) => (
                              <option key={target.id} value={target.id}>
                                {getNodeTitle(target)}
                              </option>
                            ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}