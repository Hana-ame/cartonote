import React from 'react';
import {
  ActiveTool,
  CameraState,
  GridBackdropStyle,
  NoteCategory,
  NoteColor,
  RouteConnection,
  SpatialNote,
  ViewportBookmark,
} from './types/atlas';
import {
  INITIAL_BOOKMARKS,
  INITIAL_CONNECTIONS,
  INITIAL_SPATIAL_NOTES,
} from './data/seedAtlas';
import {
  calculateCartographicDistance,
  centerCameraOnWorldPoint,
  filterSpatialNotes,
  fitNotesToViewport,
  formatGridCoordinate,
  screenToWorld,
  snapToGrid,
  zoomAroundScreenPoint,
} from './utils/canvasMath';
import { CanvasBackdrop } from './components/CanvasBackdrop';
import { NoteCardNode } from './components/NoteCardNode';
import { AtlasSidebar } from './components/AtlasSidebar';
import { MinimapRadar } from './components/MinimapRadar';
import { MapToolDock } from './components/MapToolDock';
import { NoteInspectorModal } from './components/NoteInspectorModal';
import { AtlasDataModal } from './components/AtlasDataModal';

const STORAGE_KEY_NOTES = 'cartonote_spatial_notes_v1';
const STORAGE_KEY_CONNS = 'cartonote_connections_v1';
const STORAGE_KEY_BOOKMARKS = 'cartonote_bookmarks_v1';

const COLOR_ROTATION: NoteColor[] = [
  'blue',
  'emerald',
  'amber',
  'violet',
  'rose',
  'slate',
];

export default function App() {
  // Theme state
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Persistent Spatial Notes
  const [notes, setNotes] = React.useState<SpatialNote[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_SPATIAL_NOTES;
  });

  // Persistent Connections
  const [connections, setConnections] = React.useState<RouteConnection[]>(
    () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_CONNS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {
        // ignore
      }
      return INITIAL_CONNECTIONS;
    }
  );

  // Persistent Bookmarks
  const [bookmarks, setBookmarks] = React.useState<ViewportBookmark[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_BOOKMARKS;
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
    } catch {
      // ignore
    }
  }, [notes]);

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONNS, JSON.stringify(connections));
    } catch {
      // ignore
    }
  }, [connections]);

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(bookmarks));
    } catch {
      // ignore
    }
  }, [bookmarks]);

  // Layout & Sidebar state (open by default on desktop >= 768px, closed bottom-sheet by default on mobile)
  const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [activeSidebarTab, setActiveSidebarTab] = React.useState<
    'notes' | 'bookmarks' | 'routes'
  >('notes');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState<
    NoteCategory | 'all'
  >('all');
  const [pinnedOnly, setPinnedOnly] = React.useState(false);

  // Infinite Canvas Viewport & Camera
  const canvasContainerRef = React.useRef<HTMLDivElement | null>(null);
  const lastIsMobileRef = React.useRef<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [viewportSize, setViewportSize] = React.useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1160,
    height: typeof window !== 'undefined' ? window.innerHeight - 56 : 820,
  }));

  const [camera, setCamera] = React.useState<CameraState>(() => {
    const isMob = typeof window !== 'undefined' && window.innerWidth < 768;
    const initW =
      typeof window !== 'undefined'
        ? isMob
          ? window.innerWidth
          : window.innerWidth - 320
        : 1120;
    const initH = typeof window !== 'undefined' ? window.innerHeight - 56 : 820;
    return centerCameraOnWorldPoint(
      isMob ? 0 : 40,
      isMob ? -10 : -20,
      initW,
      initH,
      isMob ? 0.72 : 0.78
    );
  });

  // Update viewport dimensions on resize or sidebar toggle
  React.useEffect(() => {
    const updateSize = () => {
      const isNowMobile = window.innerWidth < 768;
      if (isNowMobile !== lastIsMobileRef.current) {
        lastIsMobileRef.current = isNowMobile;
        setSidebarOpen(!isNowMobile);
        const w = isNowMobile ? window.innerWidth : window.innerWidth - 320;
        const h = window.innerHeight - (isNowMobile ? 48 : 56);
        setCamera(
          centerCameraOnWorldPoint(
            isNowMobile ? 0 : 40,
            isNowMobile ? -10 : -20,
            w,
            h,
            isNowMobile ? 0.72 : 0.78
          )
        );
      }
      if (canvasContainerRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        setViewportSize({
          width: Math.max(rect.width, 300),
          height: Math.max(rect.height, 300),
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [sidebarOpen]);

  // Tool & Canvas Interaction state
  const [activeTool, setActiveTool] = React.useState<ActiveTool>('select');
  const [gridStyle, setGridStyle] =
    React.useState<GridBackdropStyle>('topographic');
  const [snapEnabled, setSnapEnabled] = React.useState(true);

  const [selectedNoteId, setSelectedNoteId] = React.useState<string | null>(
    'note-origin-hub'
  );
  const [inspectorNoteId, setInspectorNoteId] = React.useState<string | null>(
    null
  );
  const [dataModalOpen, setDataModalOpen] = React.useState(false);

  // Route Linking state
  const [routeSourceId, setRouteSourceId] = React.useState<string | null>(null);

  // Distance Ruler measurement points in world space
  const [measurePoints, setMeasurePoints] = React.useState<{
    start: { x: number; y: number } | null;
    end: { x: number; y: number } | null;
  }>({ start: null, end: null });

  // Live cursor world coordinates
  const [cursorWorld, setCursorWorld] = React.useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });

  // Panning & Note Dragging refs
  const panDragRef = React.useRef<{
    active: boolean;
    startScreenX: number;
    startScreenY: number;
    initialPanX: number;
    initialPanY: number;
  }>({
    active: false,
    startScreenX: 0,
    startScreenY: 0,
    initialPanX: 0,
    initialPanY: 0,
  });

  const noteDragRef = React.useRef<{
    noteId: string | null;
    startScreenX: number;
    startScreenY: number;
    initialNoteX: number;
    initialNoteY: number;
  }>({
    noteId: null,
    startScreenX: 0,
    startScreenY: 0,
    initialNoteX: 0,
    initialNoteY: 0,
  });

  const filteredNotes = React.useMemo(
    () =>
      filterSpatialNotes(notes, searchQuery, categoryFilter, pinnedOnly),
    [notes, searchQuery, categoryFilter, pinnedOnly]
  );

  // Keyboard shortcuts for tools and navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === 'v' || e.key === 'V') setActiveTool('select');
      if (e.key === 'h' || e.key === 'H') setActiveTool('pan');
      if (e.key === 'n' || e.key === 'N') setActiveTool('drop-note');
      if (e.key === 'l' || e.key === 'L') setActiveTool('connect-route');
      if (e.key === 'm' || e.key === 'M') setActiveTool('measure');
      if (e.key === 'Escape') {
        setRouteSourceId(null);
        setMeasurePoints({ start: null, end: null });
        setActiveTool('select');
      }
      // Arrow keys pan the map
      const panStep = 60;
      if (e.key === 'ArrowLeft') {
        setCamera((c) => ({ ...c, panX: c.panX + panStep }));
      } else if (e.key === 'ArrowRight') {
        setCamera((c) => ({ ...c, panX: c.panX - panStep }));
      } else if (e.key === 'ArrowUp') {
        setCamera((c) => ({ ...c, panY: c.panY + panStep }));
      } else if (e.key === 'ArrowDown') {
        setCamera((c) => ({ ...c, panY: c.panY - panStep }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Create a new note at given world coordinates
  const createNoteAtWorld = React.useCallback(
    (worldX: number, worldY: number, openModal: boolean = false) => {
      const finalX = snapEnabled ? snapToGrid(worldX, 20) : Math.round(worldX);
      const finalY = snapEnabled ? snapToGrid(worldY, 20) : Math.round(worldY);
      const coord = formatGridCoordinate(finalX, finalY);
      const nextColor =
        COLOR_ROTATION[notes.length % COLOR_ROTATION.length] || 'blue';

      const newNote: SpatialNote = {
        id: `note-${Date.now()}`,
        title: `Sector ${coord.sector} Field Waypoint`,
        content:
          'New spatial observation logged at these coordinates. Click the edit button to customize notes, elevation, and tasks.',
        category: 'field-note',
        color: nextColor,
        x: finalX,
        y: finalY,
        width: 300,
        pinned: false,
        collapsed: false,
        elevationMeters: 450,
        checklist: [
          {
            id: `chk-${Date.now()}-1`,
            text: 'Verify local coordinates & survey markers',
            completed: false,
          },
        ],
        tags: ['survey', coord.sector.toLowerCase()],
        updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      };

      setNotes((prev) => [...prev, newNote]);
      setSelectedNoteId(newNote.id);
      if (openModal) {
        setInspectorNoteId(newNote.id);
      }
      setActiveTool('select');
    },
    [notes.length, snapEnabled]
  );

  // Create note at current viewport center
  const handleCreateNoteAtViewportCenter = () => {
    const centerWorld = screenToWorld(
      viewportSize.width / 2 - 150,
      viewportSize.height / 2 - 80,
      camera
    );
    // Offset slightly if a note already sits right at that spot
    const jitter = (notes.length % 4) * 20;
    createNoteAtWorld(centerWorld.x + jitter, centerWorld.y + jitter, true);
  };

  // Start dragging a note card
  const handleStartNoteDrag = (noteId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    const targetNote = notes.find((n) => n.id === noteId);
    if (!targetNote) return;

    setSelectedNoteId(noteId);
    noteDragRef.current = {
      noteId,
      startScreenX: e.clientX,
      startScreenY: e.clientY,
      initialNoteX: targetNote.x,
      initialNoteY: targetNote.y,
    };
  };

  // Canvas pointer down (panning, dropping notes, or measuring)
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canvasContainerRef.current) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    const clickedWorld = screenToWorld(localX, localY, camera);

    if (activeTool === 'drop-note') {
      createNoteAtWorld(clickedWorld.x - 140, clickedWorld.y - 30, false);
      return;
    }

    if (activeTool === 'measure') {
      setMeasurePoints((prev) => {
        if (!prev.start || (prev.start && prev.end)) {
          return { start: clickedWorld, end: clickedWorld };
        }
        return { ...prev, end: clickedWorld };
      });
      return;
    }

    // Otherwise start panning the infinite canvas
    panDragRef.current = {
      active: true,
      startScreenX: e.clientX,
      startScreenY: e.clientY,
      initialPanX: camera.panX,
      initialPanY: camera.panY,
    };
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (canvasContainerRef.current) {
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      const wPt = screenToWorld(localX, localY, camera);
      setCursorWorld(wPt);

      if (activeTool === 'measure' && measurePoints.start && e.buttons === 1) {
        setMeasurePoints((prev) =>
          prev.start ? { ...prev, end: wPt } : prev
        );
      }
    }

    // Handle active note card drag
    if (noteDragRef.current.noteId) {
      const { noteId, startScreenX, startScreenY, initialNoteX, initialNoteY } =
        noteDragRef.current;
      const dxWorld = (e.clientX - startScreenX) / camera.zoom;
      const dyWorld = (e.clientY - startScreenY) / camera.zoom;
      const rawX = initialNoteX + dxWorld;
      const rawY = initialNoteY + dyWorld;

      const nextX = snapEnabled ? snapToGrid(rawX, 20) : Math.round(rawX);
      const nextY = snapEnabled ? snapToGrid(rawY, 20) : Math.round(rawY);

      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId ? { ...n, x: nextX, y: nextY } : n
        )
      );
      return;
    }

    // Handle active canvas pan
    if (panDragRef.current.active) {
      const dx = e.clientX - panDragRef.current.startScreenX;
      const dy = e.clientY - panDragRef.current.startScreenY;
      setCamera((prev) => ({
        ...prev,
        panX: Math.round(panDragRef.current.initialPanX + dx),
        panY: Math.round(panDragRef.current.initialPanY + dy),
      }));
    }
  };

  const handleCanvasPointerUp = () => {
    panDragRef.current.active = false;
    noteDragRef.current.noteId = null;
  };

  // Double-click canvas to drop a note immediately
  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('article')) return;
    if (!canvasContainerRef.current) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    const worldPt = screenToWorld(localX, localY, camera);
    createNoteAtWorld(worldPt.x - 140, worldPt.y - 30, false);
  };

  // Wheel zoom around cursor position
  const handleCanvasWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!canvasContainerRef.current) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const focalX = e.clientX - rect.left;
    const focalY = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setCamera((prev) =>
      zoomAroundScreenPoint(prev, prev.zoom * factor, focalX, focalY)
    );
  };

  // Select note or complete route connection
  const handleSelectNote = (noteId: string) => {
    setSelectedNoteId(noteId);

    if (routeSourceId && routeSourceId !== noteId) {
      // Check if connection already exists
      const exists = connections.some(
        (c) =>
          (c.fromNoteId === routeSourceId && c.toNoteId === noteId) ||
          (c.fromNoteId === noteId && c.toNoteId === routeSourceId)
      );
      if (!exists) {
        const fromNote = notes.find((n) => n.id === routeSourceId);
        const toNote = notes.find((n) => n.id === noteId);
        const newConn: RouteConnection = {
          id: `conn-${Date.now()}`,
          fromNoteId: routeSourceId,
          toNoteId: noteId,
          label:
            fromNote && toNote
              ? `${fromNote.title.split(' ')[0]} → ${toNote.title.split(' ')[0]} Link`
              : 'Survey Traverse',
          style: 'solid',
        };
        setConnections((prev) => [...prev, newConn]);
      }
      setRouteSourceId(null);
      setActiveTool('select');
    } else if (activeTool === 'connect-route') {
      setRouteSourceId(noteId);
    }
  };

  const handleStartRouteFromNote = (noteId: string) => {
    if (routeSourceId === noteId) {
      setRouteSourceId(null);
      setActiveTool('select');
    } else if (routeSourceId && routeSourceId !== noteId) {
      handleSelectNote(noteId);
    } else {
      setRouteSourceId(noteId);
      setActiveTool('connect-route');
    }
  };

  const handleTogglePin = (noteId: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, pinned: !n.pinned } : n))
    );
  };

  const handleToggleCollapse = (noteId: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, collapsed: !n.collapsed } : n
      )
    );
  };

  const handleToggleChecklistItem = (noteId: string, itemId: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? {
              ...n,
              checklist: n.checklist.map((item) =>
                item.id === itemId
                  ? { ...item, completed: !item.completed }
                  : item
              ),
            }
          : n
      )
    );
  };

  const handleAddChecklistItem = (noteId: string, text: string) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? {
              ...n,
              checklist: [
                ...n.checklist,
                { id: `chk-${Date.now()}`, text, completed: false },
              ],
            }
          : n
      )
    );
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    setConnections((prev) =>
      prev.filter((c) => c.fromNoteId !== noteId && c.toNoteId !== noteId)
    );
    if (selectedNoteId === noteId) setSelectedNoteId(null);
  };

  const handleSaveInspectorNote = (updated: SpatialNote) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === updated.id ? updated : n))
    );
  };

  // Camera navigation helpers
  const handleFlyToNote = (note: SpatialNote) => {
    setSelectedNoteId(note.id);
    setCamera(
      centerCameraOnWorldPoint(
        note.x + note.width / 2,
        note.y + 90,
        viewportSize.width,
        viewportSize.height,
        Math.max(camera.zoom, 0.95)
      )
    );
  };

  const handleFlyToBookmark = (bm: ViewportBookmark) => {
    setCamera(
      centerCameraOnWorldPoint(
        bm.worldX,
        bm.worldY,
        viewportSize.width,
        viewportSize.height,
        bm.zoom
      )
    );
  };

  const handleSaveCurrentBookmark = (name: string) => {
    const centerWorld = screenToWorld(
      viewportSize.width / 2,
      viewportSize.height / 2,
      camera
    );
    const coord = formatGridCoordinate(centerWorld.x, centerWorld.y);
    const newBm: ViewportBookmark = {
      id: `bm-${Date.now()}`,
      name,
      worldX: centerWorld.x,
      worldY: centerWorld.y,
      zoom: camera.zoom,
      sectorCode: coord.sector,
    };
    setBookmarks((prev) => [...prev, newBm]);
  };

  const handleFitAll = () => {
    setCamera(
      fitNotesToViewport(
        filteredNotes.length > 0 ? filteredNotes : notes,
        viewportSize.width,
        viewportSize.height,
        110
      )
    );
  };

  const handleCenterOrigin = () => {
    setCamera(
      centerCameraOnWorldPoint(
        0,
        0,
        viewportSize.width,
        viewportSize.height,
        1
      )
    );
  };

  const inspectorNote = React.useMemo(
    () => notes.find((n) => n.id === inspectorNoteId) || null,
    [notes, inspectorNoteId]
  );

  const cursorCoord = formatGridCoordinate(cursorWorld.x, cursorWorld.y);

  const measureInfo = React.useMemo(() => {
    if (!measurePoints.start || !measurePoints.end) return null;
    return calculateCartographicDistance(
      measurePoints.start.x,
      measurePoints.start.y,
      measurePoints.end.x,
      measurePoints.end.y
    );
  }, [measurePoints]);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="h-12 md:h-14 shrink-0 flex items-center justify-between gap-4 md:gap-8 px-4 md:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#canvas"
          onClick={(e) => {
            e.preventDefault();
            handleCenterOrigin();
          }}
          className="text-base md:text-lg font-bold tracking-tight font-display text-slate-900 dark:text-white whitespace-nowrap shrink-0"
        >
          CartoNote
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav
          aria-label="Workspace Navigation"
          className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-300"
        >
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {sidebarOpen ? 'Hide Directory' : 'Show Directory'}
          </button>
          <button
            type="button"
            onClick={handleFitAll}
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Fit Atlas
          </button>
          <button
            type="button"
            onClick={handleCenterOrigin}
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Origin Datum
          </button>
          <button
            type="button"
            onClick={() => setDataModalOpen(true)}
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Atlas Data
          </button>
          <button
            type="button"
            onClick={() => setIsDark((prev) => !prev)}
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {isDark ? 'Light Map' : 'Dark Map'}
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCreateNoteAtViewportCenter}
            className="px-3.5 py-1.5 md:px-4 md:py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            + New Note Pin
          </button>
        </div>
      </header>

      {/* Main Spatial Workspace Area */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Left Collapsible Atlas Directory (Bottom Sheet on Mobile) */}
        {sidebarOpen && (
          <AtlasSidebar
            notes={notes}
            filteredNotes={filteredNotes}
            connections={connections}
            bookmarks={bookmarks}
            searchQuery={searchQuery}
            categoryFilter={categoryFilter}
            pinnedOnly={pinnedOnly}
            selectedNoteId={selectedNoteId}
            activeSidebarTab={activeSidebarTab}
            onSetSidebarTab={setActiveSidebarTab}
            onSearchChange={setSearchQuery}
            onCategoryFilterChange={setCategoryFilter}
            onTogglePinnedOnly={() => setPinnedOnly((p) => !p)}
            onFlyToNote={handleFlyToNote}
            onFlyToBookmark={handleFlyToBookmark}
            onSaveCurrentBookmark={handleSaveCurrentBookmark}
            onDeleteBookmark={(id) =>
              setBookmarks((prev) => prev.filter((b) => b.id !== id))
            }
            onDeleteConnection={(id) =>
              setConnections((prev) => prev.filter((c) => c.id !== id))
            }
            onCreateNoteAtCenter={handleCreateNoteAtViewportCenter}
            onCloseMobile={() => setSidebarOpen(false)}
          />
        )}

        {/* Infinite Draggable & Noteable Canvas Viewport */}
        <main
          id="canvas"
          ref={canvasContainerRef}
          data-testid="infinite-map-canvas"
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onDoubleClick={handleCanvasDoubleClick}
          onWheel={handleCanvasWheel}
          className={`touch-none flex-1 relative h-full overflow-hidden select-none ${
            activeTool === 'pan'
              ? 'cursor-grab active:cursor-grabbing'
              : activeTool === 'drop-note' || activeTool === 'measure'
                ? 'cursor-crosshair'
                : 'cursor-default'
          }`}
        >
          {/* SVG Infinite Topographic / Coordinate Grid */}
          <CanvasBackdrop
            camera={camera}
            gridStyle={gridStyle}
            isDark={isDark}
          />

          {/* Top-Left Live Cartographic Coordinate Readout & Mode Banner */}
          <div className="pointer-events-none absolute top-3 left-3 md:top-4 md:left-4 z-20 flex flex-wrap items-center gap-2 md:gap-3">
            <div className="pointer-events-auto flex items-center gap-2 px-2.5 py-1.5 md:px-3 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-800 text-[11px] md:text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300 shadow-xs">
              {!sidebarOpen && (
                <>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="font-sans font-semibold text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
                  >
                    Atlas ({notes.length})
                  </button>
                  <span aria-hidden="true">·</span>
                </>
              )}
              <span>SEC {cursorCoord.sector}</span>
              <span aria-hidden="true">·</span>
              <span>
                {cursorCoord.eastWest}, {cursorCoord.northSouth}
              </span>
              <span className="hidden sm:inline" aria-hidden="true">
                ·
              </span>
              <span className="hidden sm:inline">
                {Math.round(camera.zoom * 100)}%
              </span>
            </div>

            {routeSourceId && (
              <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium shadow-md">
                <span>
                  Select another waypoint card to link route
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setRouteSourceId(null);
                    setActiveTool('select');
                  }}
                  className="underline ml-1 whitespace-nowrap shrink-0"
                >
                  Cancel
                </button>
              </div>
            )}

            {activeTool === 'drop-note' && (
              <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium shadow-md">
                <span>Tap anywhere on the map terrain to drop a note pin</span>
              </div>
            )}
          </div>

          {/* World-Space SVG Layer for Route Connections & Distance Ruler */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full z-10"
            aria-hidden="true"
          >
            <defs>
              <marker
                id="route-arrow"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path
                  d="M 0 1.5 L 8 5 L 0 8.5 z"
                  fill={isDark ? '#60A5FA' : '#2563EB'}
                />
              </marker>
            </defs>

            <g
              transform={`translate(${camera.panX}, ${camera.panY}) scale(${camera.zoom})`}
            >
              {/* Route Connections between Waypoint Notes */}
              {connections.map((conn) => {
                const fromNote = notes.find((n) => n.id === conn.fromNoteId);
                const toNote = notes.find((n) => n.id === conn.toNoteId);
                if (!fromNote || !toNote) return null;

                const x1 = fromNote.x + fromNote.width / 2;
                const y1 = fromNote.y + (fromNote.collapsed ? 35 : 85);
                const x2 = toNote.x + toNote.width / 2;
                const y2 = toNote.y + (toNote.collapsed ? 35 : 85);

                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;
                const dist = calculateCartographicDistance(x1, y1, x2, y2);

                return (
                  <g key={conn.id}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isDark ? '#60A5FA' : '#2563EB'}
                      strokeWidth={2}
                      strokeDasharray={
                        conn.style === 'dashed' ? '7 5' : undefined
                      }
                      strokeOpacity="0.65"
                      markerEnd="url(#route-arrow)"
                    />
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x={-68}
                        y={-12}
                        width={136}
                        height={24}
                        rx={6}
                        fill={isDark ? '#0F172A' : '#FFFFFF'}
                        stroke={isDark ? '#334155' : '#CBD5E1'}
                        strokeWidth={1}
                      />
                      <text
                        x={0}
                        y={4}
                        textAnchor="middle"
                        fill={isDark ? '#CBD5E1' : '#334155'}
                        fontSize="10"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {dist.meters}m · {dist.bearingDeg}°
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Interactive Distance Ruler Line */}
              {measurePoints.start && measurePoints.end && measureInfo && (
                <g>
                  <line
                    x1={measurePoints.start.x}
                    y1={measurePoints.start.y}
                    x2={measurePoints.end.x}
                    y2={measurePoints.end.y}
                    stroke="#D97706"
                    strokeWidth={2.5}
                    strokeDasharray="5 4"
                  />
                  <circle
                    cx={measurePoints.start.x}
                    cy={measurePoints.start.y}
                    r={5}
                    fill="#D97706"
                  />
                  <circle
                    cx={measurePoints.end.x}
                    cy={measurePoints.end.y}
                    r={5}
                    fill="#D97706"
                  />
                  <g
                    transform={`translate(${
                      (measurePoints.start.x + measurePoints.end.x) / 2
                    }, ${(measurePoints.start.y + measurePoints.end.y) / 2 - 18})`}
                  >
                    <rect
                      x={-75}
                      y={-12}
                      width={150}
                      height={24}
                      rx={6}
                      fill="#FEF3C7"
                      stroke="#D97706"
                      strokeWidth={1}
                    />
                    <text
                      x={0}
                      y={4}
                      textAnchor="middle"
                      fill="#92400E"
                      fontSize="11"
                      fontWeight="600"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {measureInfo.meters}m ({measureInfo.bearingDeg}° BRG)
                    </text>
                  </g>
                </g>
              )}
            </g>
          </svg>

          {/* World-Space Transformed HTML Layer for Draggable Spatial Note Cards */}
          <div
            style={{
              transform: `translate3d(${camera.panX}px, ${camera.panY}px, 0) scale(${camera.zoom})`,
              transformOrigin: '0 0',
            }}
            className="absolute top-0 left-0 w-0 h-0 z-10"
          >
            {filteredNotes.map((note) => (
              <NoteCardNode
                key={note.id}
                note={note}
                isSelected={note.id === selectedNoteId}
                isRouteSource={note.id === routeSourceId}
                isConnectMode={activeTool === 'connect-route'}
                onSelect={(id) => handleSelectNote(id)}
                onStartDrag={handleStartNoteDrag}
                onTogglePin={handleTogglePin}
                onToggleCollapse={handleToggleCollapse}
                onToggleChecklistItem={handleToggleChecklistItem}
                onAddChecklistItem={handleAddChecklistItem}
                onStartRouteFrom={handleStartRouteFromNote}
                onOpenInspector={(id) => setInspectorNoteId(id)}
                onDelete={handleDeleteNote}
              />
            ))}
          </div>

          {/* Bottom-Right Interactive Minimap Radar */}
          <div className="hidden sm:block absolute bottom-5 right-5 z-20">
            <MinimapRadar
              notes={notes}
              connections={connections}
              camera={camera}
              viewportWidth={viewportSize.width}
              viewportHeight={viewportSize.height}
              selectedNoteId={selectedNoteId}
              onPanToWorldPoint={(wx, wy) =>
                setCamera(
                  centerCameraOnWorldPoint(
                    wx,
                    wy,
                    viewportSize.width,
                    viewportSize.height,
                    camera.zoom
                  )
                )
              }
              onFitAll={handleFitAll}
            />
          </div>

          {/* Floating Bottom-Center Map Tool Dock */}
          <MapToolDock
            activeTool={activeTool}
            gridStyle={gridStyle}
            snapEnabled={snapEnabled}
            zoom={camera.zoom}
            onSelectTool={(t) => {
              setActiveTool(t);
              if (t !== 'connect-route') setRouteSourceId(null);
            }}
            onCycleGridStyle={() =>
              setGridStyle((prev) =>
                prev === 'topographic'
                  ? 'blueprint'
                  : prev === 'blueprint'
                    ? 'dot-matrix'
                    : 'topographic'
              )
            }
            onToggleSnap={() => setSnapEnabled((s) => !s)}
            onZoomIn={() =>
              setCamera((c) =>
                zoomAroundScreenPoint(
                  c,
                  c.zoom + 0.15,
                  viewportSize.width / 2,
                  viewportSize.height / 2
                )
              )
            }
            onZoomOut={() =>
              setCamera((c) =>
                zoomAroundScreenPoint(
                  c,
                  c.zoom - 0.15,
                  viewportSize.width / 2,
                  viewportSize.height / 2
                )
              )
            }
            onResetZoom={() =>
              setCamera((c) =>
                zoomAroundScreenPoint(
                  c,
                  1.0,
                  viewportSize.width / 2,
                  viewportSize.height / 2
                )
              )
            }
            onCenterOrigin={handleCenterOrigin}
            onFitAll={handleFitAll}
            onOpenMobileDirectory={() => setSidebarOpen((p) => !p)}
          />
        </main>
      </div>

      {/* Waypoint Note Inspector Modal */}
      <NoteInspectorModal
        note={inspectorNote}
        onClose={() => setInspectorNoteId(null)}
        onSave={handleSaveInspectorNote}
        onDelete={handleDeleteNote}
      />

      {/* Export / Import / Restore Atlas Data Modal */}
      <AtlasDataModal
        isOpen={dataModalOpen}
        notes={notes}
        connections={connections}
        bookmarks={bookmarks}
        onClose={() => setDataModalOpen(false)}
        onImportAtlas={(data) => {
          setNotes(data.notes);
          setConnections(data.connections);
          if (data.bookmarks.length > 0) setBookmarks(data.bookmarks);
        }}
        onResetToDefault={() => {
          setNotes(INITIAL_SPATIAL_NOTES);
          setConnections(INITIAL_CONNECTIONS);
          setBookmarks(INITIAL_BOOKMARKS);
          handleCenterOrigin();
        }}
      />
    </div>
  );
}
