import React from 'react';
import { X, Plus, Trash2, MapPin, Check } from 'lucide-react';
import {
  NoteCategory,
  NoteColor,
  SpatialNote,
} from '../types/atlas';
import { CATEGORY_META, COLOR_SWATCHES } from '../data/seedAtlas';

interface NoteInspectorModalProps {
  note: SpatialNote | null;
  onClose: () => void;
  onSave: (updated: SpatialNote) => void;
  onDelete: (noteId: string) => void;
}

const CATEGORIES: NoteCategory[] = [
  'landmark',
  'field-note',
  'milestone',
  'hazard',
  'architecture',
];

const COLORS: NoteColor[] = [
  'blue',
  'emerald',
  'amber',
  'rose',
  'violet',
  'slate',
];

export const NoteInspectorModal: React.FC<NoteInspectorModalProps> = ({
  note,
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [category, setCategory] = React.useState<NoteCategory>('landmark');
  const [color, setColor] = React.useState<NoteColor>('blue');
  const [coordX, setCoordX] = React.useState(0);
  const [coordY, setCoordY] = React.useState(0);
  const [elevation, setElevation] = React.useState<string>('400');
  const [tagsText, setTagsText] = React.useState('');
  const [checklist, setChecklist] = React.useState(note?.checklist ?? []);
  const [newTaskText, setNewTaskText] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');

  React.useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setCategory(note.category);
      setColor(note.color);
      setCoordX(note.x);
      setCoordY(note.y);
      setElevation(
        note.elevationMeters !== undefined ? String(note.elevationMeters) : ''
      );
      setTagsText(note.tags.join(', '));
      setChecklist(note.checklist);
      setErrorMsg('');
    }
  }, [note]);

  if (!note) return null;

  const handleAddChecklist = () => {
    const trimmed = newTaskText.trim();
    if (!trimmed) return;
    setChecklist((prev) => [
      ...prev,
      { id: `chk-${Date.now()}`, text: trimmed, completed: false },
    ]);
    setNewTaskText('');
  };

  const handleRemoveChecklist = (id: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMsg('Please enter a waypoint title before saving.');
      return;
    }

    const parsedTags = tagsText
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const parsedElev =
      elevation.trim() !== '' && !Number.isNaN(Number(elevation))
        ? Math.round(Number(elevation))
        : undefined;

    onSave({
      ...note,
      title: cleanTitle,
      content: content.trim(),
      category,
      color,
      x: Math.round(Number(coordX) || 0),
      y: Math.round(Number(coordY) || 0),
      elevationMeters: parsedElev,
      tags: parsedTags,
      checklist,
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspector-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto"
      >
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <MapPin
                className="w-4 h-4"
                style={{ color: COLOR_SWATCHES[color].pinFill }}
              />
              <h2
                id="inspector-dialog-title"
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              >
                Edit Spatial Waypoint
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close waypoint inspector"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Fields */}
          <div className="p-6 space-y-5 flex-1 overflow-y-auto">
            {errorMsg && (
              <p
                role="alert"
                className="text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-lg px-3 py-2"
              >
                {errorMsg}
              </p>
            )}

            <div>
              <label
                htmlFor="waypoint-title-input"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Waypoint Title
              </label>
              <input
                id="waypoint-title-input"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Enter landmark or note title..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Category & Color Swatch */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Cartographic Layer
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                        category === cat
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {CATEGORY_META[cat].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Beacon Swatch
                </span>
                <div className="flex items-center gap-2.5">
                  {COLORS.map((c) => {
                    const sw = COLOR_SWATCHES[c];
                    const active = color === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        aria-label={`Select color ${sw.name}`}
                        style={{ backgroundColor: sw.hex }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                          active
                            ? 'scale-110 ring-2 ring-offset-2 ring-blue-600 dark:ring-offset-slate-900'
                            : 'opacity-80 hover:opacity-100'
                        }`}
                      >
                        {active && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Field Notes Content */}
            <div>
              <label
                htmlFor="waypoint-content-input"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Field Observations & Notes
              </label>
              <textarea
                id="waypoint-content-input"
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write spatial notes, coordinates, or research observations..."
                className="w-full px-3 py-2 text-xs leading-relaxed rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Spatial Coordinates & Elevation */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="coord-x-input"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  East/West (X)
                </label>
                <input
                  id="coord-x-input"
                  type="number"
                  value={coordX}
                  onChange={(e) => setCoordX(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label
                  htmlFor="coord-y-input"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  North/South (Y)
                </label>
                <input
                  id="coord-y-input"
                  type="number"
                  value={coordY}
                  onChange={(e) => setCoordY(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label
                  htmlFor="coord-elev-input"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Elevation (m)
                </label>
                <input
                  id="coord-elev-input"
                  type="number"
                  value={elevation}
                  onChange={(e) => setElevation(e.target.value)}
                  placeholder="420"
                  className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label
                htmlFor="waypoint-tags-input"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Index Tags (comma separated)
              </label>
              <input
                id="waypoint-tags-input"
                type="text"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="survey, hydrology, ridge"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Checklist Manager */}
            <div className="space-y-2">
              <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Waypoint Tasks ({checklist.length})
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChecklist();
                    }
                  }}
                  placeholder="Add new task item..."
                  aria-label="New task item description"
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={handleAddChecklist}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              <ul className="space-y-1 max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {checklist.map((item) => (
                  <li
                    key={item.id}
                    className="py-1.5 flex items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <span className="truncate">{item.text}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklist(item.id)}
                      aria-label={`Remove task '${item.text}'`}
                      className="text-slate-400 hover:text-rose-600 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => {
                onDelete(note.id);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Waypoint</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
