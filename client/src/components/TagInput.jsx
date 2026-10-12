import { useState } from "react";

/**
 * Editable tag/chip input.
 * value: string[]  onChange: (string[]) => void
 * suggestions: string[] - optional list of common tags shown as one-click chips
 */
const TagInput = ({ value = [], onChange, placeholder = "Type and press Enter", suggestions = [] }) => {
  const [draft, setDraft] = useState("");

  const addTag = (tag) => {
    const clean = (tag ?? draft).trim().toLowerCase();
    if (clean && !value.includes(clean)) {
      onChange([...value, clean]);
    }
    if (tag === undefined) setDraft("");
  };

  const removeTag = (tag) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !draft && value.length) {
      removeTag(value[value.length - 1]);
    }
  };

  const availableSuggestions = suggestions.filter((s) => !value.includes(s)).slice(0, 12);

  return (
    <div>
      <div className="input-field flex flex-wrap items-center gap-2">
        {value.map((tag) => (
          <span key={tag} className="tag-pill">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 text-primary-500 hover:text-primary-800"
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag()}
          placeholder={value.length ? "" : placeholder}
          className="min-w-[120px] flex-1 border-none bg-transparent p-0 text-sm outline-none focus:ring-0"
        />
      </div>

      {availableSuggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="text-xs text-slate-400">Suggestions:</span>
          {availableSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="rounded-full border border-dashed border-slate-300 px-2.5 py-0.5 text-xs text-slate-500 hover:border-primary-400 hover:text-primary-600"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagInput;
