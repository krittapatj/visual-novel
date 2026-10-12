import { useState } from 'react';
import { Play, RotateCcw, X } from 'lucide-react';

export default function StoryPreview({
  nodes,
  edges,
  onClose
}) {
  const startNode = nodes.find(
    (node) => node.data.nodeType === 'start'
  );

  const [currentId, setCurrentId] = useState(
    startNode?.id || null
  );

  const currentNode = nodes.find(
    (node) => node.id === currentId
  );

  const next = (handle = 'default') => {
    const edge = edges.find(
      (edge) =>
        edge.source === currentId &&
        edge.sourceHandle === handle
    );

    setCurrentId(edge?.target || null);
  };

  const data = currentNode?.data;
  const type = data?.nodeType;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/15 bg-[#10101b]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <Play size={18} className="text-purple-400" />
            Story Preview
          </h2>

          <div className="flex gap-4">
            <button
              onClick={() => setCurrentId(startNode?.id || null)}
              aria-label="Restart preview"
            >
              <RotateCcw size={19} />
            </button>

            <button onClick={onClose} aria-label="Close preview">
              <X size={20} />
            </button>
          </div>
        </div>

        <div
          className="flex min-h-96 flex-col justify-end bg-cover bg-center p-6"
          style={{
            backgroundImage: data?.backgroundUrl
              ? `url("${data.backgroundUrl}")`
              : 'linear-gradient(135deg, #24143f, #09090f)'
          }}
        >
          {!currentNode ? (
            <div className="rounded-xl bg-black/80 p-6 text-center">
              <p>
                {startNode
                  ? 'End of connected path.'
                  : 'No Start node found.'}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/15 bg-black/85 p-6">
              {type === 'start' && (
                <>
                  <p className="mb-4">The story begins...</p>
                  <button
                    onClick={() => next()}
                    className="rounded-lg bg-purple-600 px-5 py-2"
                  >
                    Start Story
                  </button>
                </>
              )}

              {type === 'dialogue' && (
                <>
                  <p className="font-semibold text-purple-300">
                    {data.speaker || 'Narrator'}
                  </p>
                  <p className="my-4 whitespace-pre-wrap">
                    {data.text || '...'}
                  </p>
                  <button
                    onClick={() => next()}
                    className="rounded-lg bg-purple-600 px-5 py-2"
                  >
                    Continue →
                  </button>
                </>
              )}

              {type === 'scene' && (
                <>
                  <p className="mb-4">
                    {data.sceneName || 'Scene Change'}
                  </p>
                  <button
                    onClick={() => next()}
                    className="rounded-lg bg-purple-600 px-5 py-2"
                  >
                    Continue →
                  </button>
                </>
              )}

              {type === 'choice' && (
                <>
                  <p className="mb-4 font-semibold">
                    {data.question}
                  </p>

                  <div className="space-y-3">
                    {(data.options || []).map((option) => (
                      <button
                        key={option.id}
                        onClick={() => next(option.id)}
                        className="block w-full rounded-lg border border-purple-500/40 bg-purple-600/20 px-5 py-3 text-left hover:bg-purple-600/40"
                      >
                        {option.text}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {type === 'ending' && (
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-purple-300">
                    {data.endingName || 'The End'}
                  </h3>

                  <button
                    onClick={() => setCurrentId(startNode?.id || null)}
                    className="mt-6 rounded-lg bg-purple-600 px-5 py-2"
                  >
                    Play Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}