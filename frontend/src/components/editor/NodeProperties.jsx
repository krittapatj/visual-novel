
import { randomUUID } from '../editor/uuid';
import { Trash2, Plus, UserRound, Image as ImageIcon } from 'lucide-react';
import AssetPicker, { getAssetUrl } from './AssetPicker';

const inputClass =
  'w-full rounded-lg border border-white/10 bg-[#10101b] px-3 py-2 text-sm text-white outline-none focus:border-purple-500';

export default function NodeProperties({
  node,
  onUpdate,
  onDelete,
  onRemoveOption,
  assets = [],
  characters = []
}) {
  if (!node) {
    return (
      <aside className="w-full border-t border-white/10 bg-[#171725] p-5 text-sm text-gray-400 lg:w-72 lg:border-l lg:border-t-0">
        Select a node to edit its properties.
      </aside>
    );
  }

  const type = node.data.nodeType;
  const data = node.data;

  const update = (key, value) => {
    onUpdate(node.id, { [key]: value });
  };

  const updateMultiple = (changes) => {
    onUpdate(node.id, changes);
  };

  const selectedCharacter = characters.find(
    (character) =>
      Number(character.character_id) === Number(data.characterId)
  );

  const expressions = selectedCharacter?.expressions || [];

  const selectedExpression = expressions.find(
    (expression) =>
      Number(expression.expression_id) === Number(data.expressionId)
  );

  const field = (label, key, multiline = false) => (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-400">
        {label}
      </label>

      {multiline ? (
        <textarea
          value={data[key] || ''}
          onChange={(e) => update(key, e.target.value)}
          rows={5}
          className={inputClass}
        />
      ) : (
        <input
          value={data[key] || ''}
          onChange={(e) => update(key, e.target.value)}
          className={inputClass}
        />
      )}
    </div>
  );

  const addOption = () => {
    update('options', [
      ...(data.options || []),
      {
        id: randomUUID(),
        text: 'New option'
      }
    ]);
  };

  const changeOption = (optionId, text) => {
    update(
      'options',
      (data.options || []).map((option) =>
        option.id === optionId
          ? { ...option, text }
          : option
      )
    );
  };

  const handleCharacterChange = (value) => {
    const characterId = value ? Number(value) : null;

    const character = characters.find(
      (item) => Number(item.character_id) === characterId
    );

    const defaultExpression =
      character?.expressions?.find(
        (expression) => Boolean(expression.is_default)
      ) || character?.expressions?.[0];

    updateMultiple({
      characterId,
      expressionId: defaultExpression?.expression_id ?? null,
      ...(character ? { speaker: character.character_name } : {})
    });
  };

  return (
    <aside className="w-full space-y-5 overflow-y-auto border-t border-white/10 bg-[#171725] p-5 lg:w-72 lg:border-l lg:border-t-0">
      <div>
        <h2 className="font-semibold">Node Properties</h2>
        <p className="mt-1 text-xs uppercase text-purple-400">
          {type}
        </p>
      </div>

      {/* Start Node */}
      {type === 'start' && field('Label', 'label')}

      {/* Dialogue Node */}
      {type === 'dialogue' && (
        <>
          {field('Speaker', 'speaker')}
          {field('Dialogue Text', 'text', true)}

          <div className="space-y-4 border-t border-white/10 pt-5">
            <div className="flex items-center gap-2">
              <UserRound size={17} className="text-purple-400" />
              <h3 className="text-sm font-semibold">
                Character Settings
              </h3>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-400">
                Character
              </label>

              <select
                value={data.characterId ?? ''}
                onChange={(e) => handleCharacterChange(e.target.value)}
                className={inputClass}
              >
                <option value="">No Character</option>

                {characters.map((character) => (
                  <option
                    key={character.character_id}
                    value={character.character_id}
                  >
                    {character.character_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-400">
                Expression
              </label>

              <select
                value={data.expressionId ?? ''}
                onChange={(e) =>
                  update(
                    'expressionId',
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                disabled={!selectedCharacter}
                className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <option value="">No Expression</option>

                {expressions.map((expression) => (
                  <option
                    key={expression.expression_id}
                    value={expression.expression_id}
                  >
                    {expression.expression_name}
                    {Boolean(expression.is_default) ? ' (Default)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedExpression && (
              <div className="overflow-hidden rounded-xl border border-white/10 bg-[#10101b]">
                <div className="flex h-48 items-center justify-center p-3">
                  <img
                    src={getAssetUrl(selectedExpression.file_path)}
                    alt={selectedExpression.expression_name}
                    className="h-full max-w-full object-contain"
                  />
                </div>

                <p className="border-t border-white/10 p-3 text-center text-xs text-gray-400">
                  {selectedCharacter.character_name} — {selectedExpression.expression_name}
                </p>
              </div>
            )}

            {characters.length === 0 && (
              <p className="text-xs text-amber-300">
                No characters available. Create a character in
                Character Manager first.
              </p>
            )}

            {selectedCharacter && expressions.length === 0 && (
              <p className="text-xs text-amber-300">
                This character has no expressions. Add an image
                in Character Manager first.
              </p>
            )}
          </div>
        </>
      )}

      {/* Scene Node */}
      {type === 'scene' && (
        <>
          {field('Scene Name', 'sceneName')}

          <div className="space-y-4 border-t border-white/10 pt-5">
            <div className="flex items-center gap-2">
              <ImageIcon size={17} className="text-purple-400" />
              <h3 className="text-sm font-semibold">
                Scene Background
              </h3>
            </div>

            <AssetPicker
              assets={assets}
              type="background"
              value={data.backgroundAssetId}
              onChange={(assetId) =>
                updateMultiple({
                  backgroundAssetId: assetId,
                  backgroundUrl: ''
                })
              }
              label="Select Background"
            />
          </div>

          <div className="space-y-2">
            {field('Background URL (Optional)', 'backgroundUrl')}
            <p className="text-xs text-gray-500">
              Use an image from Asset Manager or enter a URL manually.
            </p>
          </div>
        </>
      )}

      {/* Ending Node */}
      {type === 'ending' && field('Ending Name', 'endingName')}

      {/* Choice Node */}
      {type === 'choice' && (
        <>
          {field('Question', 'question')}

          <div className="space-y-3">
            <h3 className="text-sm font-medium">
              Choices
            </h3>

            {(data.options || []).map((option, index) => (
              <div key={option.id} className="flex gap-2">
                <input
                  aria-label={`Option ${index + 1}`}
                  value={option.text}
                  onChange={(e) =>
                    changeOption(option.id, e.target.value)
                  }
                  className={inputClass}
                />

                <button
                  type="button"
                  onClick={() => onRemoveOption(node.id, option.id)}
                  className="text-red-400"
                  aria-label="Remove option"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addOption}
              className="flex items-center gap-2 text-sm text-purple-400"
            >
              <Plus size={16} />
              Add Choice
            </button>
          </div>
        </>
      )}

      {/* Delete Node */}
      <button
        type="button"
        onClick={() => onDelete(node.id)}
        className="flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
      >
        <Trash2 size={16} />
        Delete Node
      </button>
    </aside>
  );
}
