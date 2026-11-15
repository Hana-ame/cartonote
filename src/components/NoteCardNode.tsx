import React from 'react';
import {
  MapPin,
  Pin,
  ChevronDown,
  ChevronUp,
  Link2,
  Trash2,
  Edit3,
  CheckSquare,
  Square,
  Plus,
} from 'lucide-react';
import { SpatialNote } from '../types/atlas';
import { CATEGORY_META, COLOR_SWATCHES } from '../data/seedAtlas';
import { formatGridCoordinate } from '../utils/canvasMath';

interface NoteCardNodeProps {
  note: SpatialNote;
  isSelected: boolean;
  isRouteSource: boolean;
  isConnectMode: boolean;
  onSelect: (noteId: string, e: React.MouseEvent) => void;
  onStartDrag: (noteId: string, e: React.PointerEvent) => void;
  onTogglePin: (noteId: string) => void;
  onToggleCollapse: (noteId: string) => void;
  onToggleChecklistItem: (noteId: string, itemId: string) => void;
  onAddChecklistItem: (noteId: string, text: string) => void;
  onStartRouteFrom: (noteId: string) => void;
  onOpenInspector: (noteId: string) => void;
  onDelete: (noteId: string) => void;
}

export const NoteCardNode: React.FC<NoteCardNodeProps> = ({
  note,
  isSelected,
  isRouteSource,
  isConnectMode,
  onSelect,
  onStartDrag,
  onTogglePin,
  onToggleCollapse,
  onToggleChecklistItem,
  onAddChecklistItem,
  onStartRouteFrom,
  onOpenInspector,
  onDelete,
}) => {
  const [quickTaskText, setQuickTaskText] = React.useState('');
  const [showQuickTaskInput, setShowQuickTaskInput] = React.useState(false);

  const catMeta = CATEGORY_META[note.category];
  const colorMeta = COLOR_SWATCHES[note.color];
  const coord = formatGridCoordinate(note.x, note.y);

  const completedCount = note.checklist.filter((c) => c.completed).length;

  const handleQuickTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickTaskText.trim();
    if (!trimmed) return;
    onAddChecklistItem(note.id, trimmed);
    setQuickTaskText('');
    setShowQuickTaskInput(false);
  };

  return (
    <article
      style={{
        transform: `translate3d(${note.x}px, ${note.y}px, 0)`,
        width: `${note.width}px`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(note.id, e);
      }}
      aria-label={`Spatial note: ${note.title}`}
      className={`group absolute top-0 left-0 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border transition-shadow duration-150 select-none ${
        isRouteSource
          ? 'border-blue-600 ring-2 ring-blue-500/50 shadow-lg'
          : isSelected
            ? `border-slate-400 dark:border-slate-600 ${colorMeta.borderSelected} shadow-lg`
            : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
      } ${isConnectMode ? 'cursor-crosshair' : ''}`}
    >
      {/* Map Pin Anchor Spike on top-left corner */}
      <div
        className="pointer-events-none absolute -top-2.5 left-4 flex items-center gap-1.5 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono tabular-nums text-slate-600 dark:text-slate-400"
      >
        <MapPin
          className="w-3 h-3 shrink-0"
          style={{ color: colorMeta.pinFill }}
        />
        <span>{coord.sector}</span>
        <span aria-hidden="true">·</span>
        <span>
          {coord.eastWest} {coord.northSouth}
        </span>
      </div>

      {/* Draggable Card Header */}
      <div
        onPointerDown={(e) => {
          if (
            (e.target as HTMLElement).closest('button') ||
            (e.target as HTMLElement).closest('input')
          ) {
            return;
          }
          onStartDrag(note.id, e);
        }}
        className={`touch-none flex items-start justify-between gap-2 pt-4 pb-2.5 px-3.5 rounded-t-xl cursor-grab active:cursor-grabbing border-b border-slate-100 dark:border-slate-800/80 ${colorMeta.headerBg}`}
      >
        <div className="min-w-0 flex-1">
          {/* Unboxed quiet metadata line */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
            <span className={`font-semibold ${catMeta.accentClass}`}>
              {catMeta.label}
            </span>
            {note.elevationMeters !== undefined && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {note.elevationMeters}m ASL
                </span>
              </>
            )}
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug break-words">
            {note.title}
          </h3>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(note.id);
            }}
            aria-label={
              note.pinned
                ? `Unpin '${note.title}' from priority landmarks`
                : `Pin '${note.title}' as priority landmark`
            }
            title={note.pinned ? 'Pinned Landmark' : 'Pin Note'}
            className={`p-1.5 rounded-md transition-colors ${
              note.pinned
                ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStartRouteFrom(note.id);
            }}
            aria-label={`Link route from '${note.title}'`}
            title="Connect route to another note"
            className={`p-1.5 rounded-md transition-colors ${
              isRouteSource
                ? 'text-white bg-blue-600'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenInspector(note.id);
            }}
            aria-label={`Edit details of '${note.title}'`}
            title="Edit Note"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(note.id);
            }}
            aria-label={
              note.collapsed
                ? `Expand '${note.title}'`
                : `Collapse '${note.title}'`
            }
            title={note.collapsed ? 'Expand Note' : 'Collapse Note'}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            {note.collapsed ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Note Body */}
      {!note.collapsed && (
        <div className="p-3.5 space-y-3">
          {note.content && (
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line select-text">
              {note.content}
            </p>
          )}

          {/* Field Checklist */}
          {(note.checklist.length > 0 || showQuickTaskInput) && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-medium">Field Checklist</span>
                <span className="font-mono tabular-nums">
                  {completedCount}/{note.checklist.length}
                </span>
              </div>
              <ul className="space-y-1">
                {note.checklist.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleChecklistItem(note.id, item.id);
                      }}
                      className="flex items-start gap-2 w-full text-left text-xs py-0.5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      {item.completed ? (
                        <CheckSquare className="w-3.5 h-3.5 mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                      )}
                      <span
                        className={
                          item.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : ''
                        }
                      >
                        {item.text}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showQuickTaskInput && (
            <form
              onSubmit={handleQuickTaskSubmit}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 pt-1"
            >
              <input
                type="text"
                value={quickTaskText}
                onChange={(e) => setQuickTaskText(e.target.value)}
                placeholder="Add field task..."
                aria-label={`New checklist item for ${note.title}`}
                autoFocus
                className="flex-1 min-w-0 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-2 py-1 text-[11px] font-medium bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap shrink-0"
              >
                Add
              </button>
            </form>
          )}

          {/* Footer: Unboxed tags & quick actions */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 dark:text-slate-500">
            <div className="truncate">
              {note.tags.length > 0 ? (
                <span>
                  {note.tags.map((t, idx) => (
                    <React.Fragment key={t}>
                      {idx > 0 && <span aria-hidden="true"> · </span>}
                      <span>#{t}</span>
                    </React.Fragment>
                  ))}
                </span>
              ) : (
                <span className="font-mono tabular-nums">{note.updatedAt}</span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowQuickTaskInput((prev) => !prev);
                }}
                aria-label={`Add checklist item to '${note.title}'`}
                className="inline-flex items-center gap-0.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3 h-3" />
                <span>Task</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note.id);
                }}
                aria-label={`Delete '${note.title}'`}
                title="Delete Note"
                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};
