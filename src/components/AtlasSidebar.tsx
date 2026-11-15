import React from 'react';
import {
  Search,
  MapPin,
  Bookmark,
  Plus,
  Navigation,
  Route,
  Trash2,
  Pin,
  X,
} from 'lucide-react';
import {
  NoteCategory,
  RouteConnection,
  SpatialNote,
  ViewportBookmark,
} from '../types/atlas';
import { CATEGORY_META, COLOR_SWATCHES } from '../data/seedAtlas';
import {
  calculateCartographicDistance,
  formatGridCoordinate,
} from '../utils/canvasMath';

interface AtlasSidebarProps {
  notes: SpatialNote[];
  filteredNotes: SpatialNote[];
  connections: RouteConnection[];
  bookmarks: ViewportBookmark[];
  searchQuery: string;
  categoryFilter: NoteCategory | 'all';
  pinnedOnly: boolean;
  selectedNoteId: string | null;
  activeSidebarTab: 'notes' | 'bookmarks' | 'routes';
  onSetSidebarTab: (tab: 'notes' | 'bookmarks' | 'routes') => void;
  onSearchChange: (q: string) => void;
  onCategoryFilterChange: (cat: NoteCategory | 'all') => void;
  onTogglePinnedOnly: () => void;
  onFlyToNote: (note: SpatialNote) => void;
  onFlyToBookmark: (bm: ViewportBookmark) => void;
  onSaveCurrentBookmark: (name: string) => void;
  onDeleteBookmark: (id: string) => void;
  onDeleteConnection: (id: string) => void;
  onCreateNoteAtCenter: () => void;
  onCloseMobile?: () => void;
}

const FILTER_OPTIONS: Array<{ id: NoteCategory | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'landmark', label: 'Landmark' },
  { id: 'field-note', label: 'Field' },
  { id: 'milestone', label: 'Milestone' },
  { id: 'hazard', label: 'Caution' },
  { id: 'architecture', label: 'Arch' },
];

export const AtlasSidebar: React.FC<AtlasSidebarProps> = ({
  notes,
  filteredNotes,
  connections,
  bookmarks,
  searchQuery,
  categoryFilter,
  pinnedOnly,
  selectedNoteId,
  activeSidebarTab,
  onSetSidebarTab,
  onSearchChange,
  onCategoryFilterChange,
  onTogglePinnedOnly,
  onFlyToNote,
  onFlyToBookmark,
  onSaveCurrentBookmark,
  onDeleteBookmark,
  onDeleteConnection,
  onCreateNoteAtCenter,
  onCloseMobile,
}) => {
  const [newBookmarkName, setNewBookmarkName] = React.useState('');

  const handleBookmarkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newBookmarkName.trim();
    if (!trimmed) return;
    onSaveCurrentBookmark(trimmed);
    setNewBookmarkName('');
  };

  return (
    <>
      {/* Mobile Backdrop Scrim */}
      <div
        onClick={onCloseMobile}
        aria-hidden="true"
        className="md:hidden fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs"
      />

      <aside
        aria-label="Atlas Directory Sidebar"
        className="fixed inset-x-0 bottom-0 z-50 max-h-[82vh] rounded-t-3xl md:static md:inset-auto md:z-20 md:max-h-none md:rounded-none w-full md:w-80 shrink-0 md:h-full bg-white dark:bg-slate-900 border-t md:border-t-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col select-none shadow-2xl md:shadow-none"
      >
        {/* Mobile Bottom Sheet Grab Handle & Header */}
        <div className="md:hidden flex items-center justify-between px-4 pt-2.5 pb-1">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Atlas Directory
          </span>
          <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close Atlas Directory"
            className="p-2 -mr-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Directory Switcher Tabs (Interactive Functional Buttons) */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div
            role="tablist"
            aria-label="Atlas Directory Views"
            className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-lg"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeSidebarTab === 'notes'}
              onClick={() => onSetSidebarTab('notes')}
              className={`px-2.5 py-2 md:py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeSidebarTab === 'notes'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Waypoints ({notes.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeSidebarTab === 'routes'}
              onClick={() => onSetSidebarTab('routes')}
              className={`px-2.5 py-2 md:py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeSidebarTab === 'routes'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Routes ({connections.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeSidebarTab === 'bookmarks'}
              onClick={() => onSetSidebarTab('bookmarks')}
              className={`px-2.5 py-2 md:py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeSidebarTab === 'bookmarks'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sectors ({bookmarks.length})
            </button>
          </div>

          {activeSidebarTab === 'notes' && (
            <>
              {/* Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search notes, tags, or tasks..."
                  aria-label="Search spatial notes"
                  className="w-full pl-8 pr-7 py-2 md:py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    aria-label="Clear search query"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Layer Filter Bar */}
              <div className="flex items-center justify-between gap-1">
                <div className="flex flex-wrap items-center gap-1">
                  {FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onCategoryFilterChange(opt.id)}
                      className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                        categoryFilter === opt.id
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={onTogglePinnedOnly}
                  aria-label="Filter pinned landmarks only"
                  title="Pinned Only"
                  className={`p-1.5 rounded transition-colors shrink-0 ${
                    pinnedOnly
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Scrollable Directory Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
          {activeSidebarTab === 'notes' && (
            <>
              {filteredNotes.length === 0 ? (
                <div className="p-6 text-center space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No spatial notes match the current filter criteria.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    {(searchQuery || categoryFilter !== 'all' || pinnedOnly) && (
                      <button
                        type="button"
                        onClick={() => {
                          onSearchChange('');
                          onCategoryFilterChange('all');
                          if (pinnedOnly) onTogglePinnedOnly();
                        }}
                        className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
                      >
                        Reset Filters
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onCreateNoteAtCenter();
                        onCloseMobile?.();
                      }}
                      className="px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
                    >
                      Drop Note Here
                    </button>
                  </div>
                </div>
              ) : (
                filteredNotes.map((note) => {
                  const coord = formatGridCoordinate(note.x, note.y);
                  const cat = CATEGORY_META[note.category];
                  const isSelected = note.id === selectedNoteId;

                  return (
                    <div
                      key={note.id}
                      className={`p-3.5 transition-colors ${
                        isSelected
                          ? 'bg-blue-50/70 dark:bg-blue-950/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onFlyToNote(note);
                            onCloseMobile?.();
                          }}
                          className="text-left flex-1 min-w-0 group"
                        >
                          {/* Clean unboxed metadata */}
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                            <span className={`font-semibold ${cat.accentClass}`}>
                              {cat.label}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              {coord.compact}
                            </span>
                          </div>
                          <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {note.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                            {note.content}
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onFlyToNote(note);
                            onCloseMobile?.();
                          }}
                          aria-label={`Fly to ${note.title}`}
                          title="Fly camera to note"
                          className="p-2 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors shrink-0"
                        >
                          <Navigation
                            className="w-3.5 h-3.5"
                            style={{ color: COLOR_SWATCHES[note.color].pinFill }}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {activeSidebarTab === 'routes' && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {connections.length === 0 ? (
                <div className="p-6 text-center space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No survey routes linked yet. Tap the link icon on any note card or select the Link Route tool in the bottom dock to connect two waypoints.
                  </p>
                </div>
              ) : (
                connections.map((conn) => {
                  const fromNote = notes.find((n) => n.id === conn.fromNoteId);
                  const toNote = notes.find((n) => n.id === conn.toNoteId);
                  if (!fromNote || !toNote) return null;

                  const dist = calculateCartographicDistance(
                    fromNote.x,
                    fromNote.y,
                    toNote.x,
                    toNote.y
                  );

                  return (
                    <div
                      key={conn.id}
                      className="p-3.5 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          <Route className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>{dist.meters}m</span>
                          <span aria-hidden="true">·</span>
                          <span>{dist.bearingDeg}° BRG</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                          {conn.label}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {fromNote.title} → {toNote.title}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteConnection(conn.id)}
                        aria-label={`Remove route '${conn.label}'`}
                        className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeSidebarTab === 'bookmarks' && (
            <div className="p-3.5 space-y-4">
              <form onSubmit={handleBookmarkSubmit} className="space-y-2">
                <label
                  htmlFor="bookmark-name-input"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Bookmark Current Camera Sector
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="bookmark-name-input"
                    type="text"
                    value={newBookmarkName}
                    onChange={(e) => setNewBookmarkName(e.target.value)}
                    placeholder="e.g. Northern Glacier Basin"
                    className="flex-1 min-w-0 px-2.5 py-2 md:py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 px-3 py-2 md:py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              </form>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
                {bookmarks.map((bm) => {
                  const coord = formatGridCoordinate(bm.worldX, bm.worldY);
                  return (
                    <div
                      key={bm.id}
                      className="py-2.5 flex items-center justify-between gap-2"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onFlyToBookmark(bm);
                          onCloseMobile?.();
                        }}
                        className="text-left min-w-0 flex-1 group"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          <Bookmark className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span className="truncate">{bm.name}</span>
                        </div>
                        <p className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-0.5">
                          {coord.compact} · {Math.round(bm.zoom * 100)}%
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteBookmark(bm.id)}
                        aria-label={`Delete bookmark '${bm.name}'`}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Summary Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="font-mono tabular-nums">
              {filteredNotes.length} of {notes.length} waypoints visible
            </span>
          </span>
          <span>Double-tap map to pin</span>
        </div>
      </aside>
    </>
  );
};
