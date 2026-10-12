
import { useState } from 'react';
import { Play, RotateCcw, X, ArrowLeft } from 'lucide-react';
import { getAssetUrl } from './AssetPicker';

export default function StoryPreview({
  nodes = [],
  edges = [],
  assets = [],
  characters = [],
  onClose
}) {
  const startNode = nodes.find(
    (node) => node.data.nodeType === 'start'
  );

  const [history, setHistory] = useState(
    startNode ? [startNode.id] : []
  );

  const currentId = history[history.length - 1] || null;

  const currentNode = nodes.find(
    (node) => node.id === currentId
  );

  const data = currentNode?.data;
  const type = data?.nodeType;

  // Find image by Asset ID
  const findAssetUrl = (assetId) => {
    if (assetId == null || assetId === '') return null;

    const asset = assets.find(
      (item) => Number(item.asset_id) === Number(assetId)
    );

    return asset ? getAssetUrl(asset.file_path) : null;
  };

  // Keep the latest background along the visited path
  const getCurrentBackground = () => {
    let background = null;

    for (const nodeId of history) {
      const node = nodes.find((item) => item.id === nodeId);

      if (node?.data?.nodeType !== 'scene') continue;

      const sceneData = node.data;

      if (sceneData.backgroundAssetId != null) {
        background = findAssetUrl(sceneData.backgroundAssetId);
      } else if (sceneData.backgroundUrl) {
        background = sceneData.backgroundUrl;
      }
    }

    return background;
  };

  const backgroundUrl = getCurrentBackground();

  // Find the selected character and expression
  const selectedCharacter = characters.find(
    (character) =>
      Number(character.character_id) === Number(data?.characterId)
  );

  const selectedExpression = selectedCharacter?.expressions?.find(
    (expression) =>
      Number(expression.expression_id) === Number(data?.expressionId)
  );

  const defaultExpression =
    selectedCharacter?.expressions?.find(
      (expression) => Boolean(expression.is_default)
    ) || selectedCharacter?.expressions?.[0];

  const activeExpression = selectedExpression || defaultExpression;

  const characterImage =
    type === 'dialogue' && activeExpression
      ? getAssetUrl(activeExpression.file_path)
      : null;

  const speakerName =
    data?.speaker ||
    selectedCharacter?.character_name ||
    'Narrator';

  // Move to next node
  const next = (handle = 'default') => {
    const edge = edges.find(
      (edge) =>
        edge.source === currentId &&
        (edge.sourceHandle || 'default') === handle
    );

    if (!edge) {
      setHistory((previous) => [...previous, null]);
      return;
    }

    setHistory((previous) => [...previous, edge.target]);
  };

  // Return to previous node
  const goBack = () => {
    setHistory((previous) =>
      previous.length > 1 ? previous.slice(0, -1) : previous
    );
  };

  // Restart story and reset background
  const restart = () => {
    setHistory(startNode ? [startNode.id] : []);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-white/15 bg-[#10101b]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <Play size={18} className="text-purple-400" />
            Story Preview
          </h2>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={goBack}
              disabled={history.length <= 1}
              aria-label="Previous node"
              title="Previous node"
              className="text-gray-300 hover:text-white disabled:opacity-30"
            >
              <ArrowLeft size={19} />
            </button>

            <button
              type="button"
              onClick={restart}
              aria-label="Restart preview"
              title="Restart preview"
              className="text-gray-300 hover:text-white"
            >
              <RotateCcw size={19} />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="text-gray-300 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Visual Novel Screen */}
        <div
          className="relative flex min-h-[480px] flex-col justify-end overflow-hidden bg-cover bg-center p-4 sm:min-h-[560px] sm:p-6"
          style={{
            backgroundImage: backgroundUrl
              ? `url("${backgroundUrl.replace(/["\\\n\r]/g, '')}")`
              : 'linear-gradient(135deg, #24143f, #09090f)'
          }}
        >
          {/* Dark overlay for text readability */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />

          {/* Character Sprite */}
          {characterImage && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 top-6 flex items-end justify-center">
              <img
                src={characterImage}
                alt={`${selectedCharacter?.character_name || 'Character'} - ${activeExpression.expression_name}`}
                className="h-[85%] max-w-[90%] object-contain object-bottom drop-shadow-2xl"
              />
            </div>
          )}

          {/* Dialogue / Interaction Box */}
          <div className="relative z-10 rounded-xl border border-white/20 bg-black/85 p-5 text-white shadow-2xl backdrop-blur-sm sm:p-6">

            {!currentNode ? (
              <div className="text-center">
                <p>
                  {startNode
                    ? 'End of connected path.'
                    : 'No Start node found.'}
                </p>

                {startNode && (
                  <button
                    type="button"
                    onClick={restart}
                    className="mt-5 rounded-lg bg-purple-600 px-5 py-2 hover:bg-purple-500"
                  >
                    Play Again
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Start Node */}
                {type === 'start' && (
                  <>
                    <p className="mb-4 text-lg">
                      The story begins...
                    </p>

                    <button
                      type="button"
                      onClick={() => next()}
                      className="rounded-lg bg-purple-600 px-5 py-2 hover:bg-purple-500"
                    >
                      Start Story
                    </button>
                  </>
                )}

                {/* Dialogue Node */}
                {type === 'dialogue' && (
                  <>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="rounded-lg bg-purple-600/30 px-3 py-1.5 font-semibold text-purple-200">
                        {speakerName}
                      </span>

                      {activeExpression && (
                        <span className="text-xs text-gray-400">
                          {activeExpression.expression_name}
                        </span>
                      )}
                    </div>

                    <p className="my-5 min-h-12 whitespace-pre-wrap text-base leading-relaxed sm:text-lg">
                      {data.text || '...'}
                    </p>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => next()}
                        className="rounded-lg bg-purple-600 px-5 py-2 hover:bg-purple-500"
                      >
                        Continue →
                      </button>
                    </div>
                  </>
                )}

                {/* Scene Node */}
                {type === 'scene' && (
                  <>
                    <p className="mb-4 text-lg font-medium">
                      {data.sceneName || 'Scene Change'}
                    </p>

                    <button
                      type="button"
                      onClick={() => next()}
                      className="rounded-lg bg-purple-600 px-5 py-2 hover:bg-purple-500"
                    >
                      Continue →
                    </button>
                  </>
                )}

                {/* Choice Node */}
                {type === 'choice' && (
                  <>
                    <p className="mb-5 text-lg font-semibold">
                      {data.question || 'Choose an option'}
                    </p>

                    <div className="space-y-3">
                      {(data.options || []).map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => next(option.id)}
                          className="block w-full rounded-lg border border-purple-500/40 bg-purple-600/20 px-5 py-3 text-left transition-colors hover:bg-purple-600/40"
                        >
                          {option.text}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Ending Node */}
                {type === 'ending' && (
                  <div className="text-center">
                    <p className="mb-2 text-sm uppercase tracking-widest text-purple-300">
                      Story Complete
                    </p>

                    <h3 className="text-2xl font-bold text-white">
                      {data.endingName || 'The End'}
                    </h3>

                    <button
                      type="button"
                      onClick={restart}
                      className="mt-6 rounded-lg bg-purple-600 px-5 py-2 hover:bg-purple-500"
                    >
                      Play Again
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
