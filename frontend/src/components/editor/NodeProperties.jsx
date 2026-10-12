import { randomUUID } from '../editor/uuid';
import { Trash2, Plus } from 'lucide-react';

const inputClass =
  'w-full rounded-lg border border-white/10 bg-[#10101b] px-3 py-2 text-sm text-white outline-none focus:border-purple-500';

export default function NodeProperties({
  node,
  onUpdate,
  onDelete,
  onRemoveOption
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
      data.options.map((option) =>
        option.id === optionId
          ? { ...option, text }
          : option
      )
    );
  };

  return (
    <aside className="w-full space-y-5 overflow-y-auto border-t border-white/10 bg-[#171725] p-5 lg:w-72 lg:border-l lg:border-t-0">
      <div>
        <h2 className="font-semibold">Node Properties</h2>
        <p className="mt-1 text-xs uppercase text-purple-400">
          {type}
        </p>
      </div>

      {type === 'start' && field('Label', 'label')}

      {type === 'dialogue' && (
        <>
          {field('Speaker', 'speaker')}
          {field('Dialogue Text', 'text', true)}
        </>
      )}

      {type === 'scene' && (
        <>
          {field('Scene Name', 'sceneName')}
          {field('Background URL', 'backgroundUrl')}
        </>
      )}

      {type === 'ending' && (
        field('Ending Name', 'endingName')
      )}

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