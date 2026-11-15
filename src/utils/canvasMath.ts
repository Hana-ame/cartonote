import { CameraState, NoteCategory, SpatialNote } from '../types/atlas';

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 2.4;

/**
 * Clamp a number between min and max.
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

/**
 * Convert screen pixel coordinates (relative to the canvas container top-left)
 * into infinite world coordinates.
 * screenX = worldX * zoom + panX  =>  worldX = (screenX - panX) / zoom
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  camera: CameraState
): { x: number; y: number } {
  const safeZoom = camera.zoom || 1;
  return {
    x: Math.round((screenX - camera.panX) / safeZoom),
    y: Math.round((screenY - camera.panY) / safeZoom),
  };
}

/**
 * Convert infinite world coordinates into screen pixel coordinates
 * (relative to the canvas container top-left).
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  camera: CameraState
): { x: number; y: number } {
  return {
    x: worldX * camera.zoom + camera.panX,
    y: worldY * camera.zoom + camera.panY,
  };
}

/**
 * Zoom around a specific focal screen point (e.g. cursor position or viewport center)
 * so the world coordinate under that screen point remains stationary.
 */
export function zoomAroundScreenPoint(
  camera: CameraState,
  targetZoom: number,
  focalScreenX: number,
  focalScreenY: number
): CameraState {
  const nextZoom = clamp(Number(targetZoom.toFixed(3)), MIN_ZOOM, MAX_ZOOM);
  const worldBeforeX = (focalScreenX - camera.panX) / camera.zoom;
  const worldBeforeY = (focalScreenY - camera.panY) / camera.zoom;

  const nextPanX = focalScreenX - worldBeforeX * nextZoom;
  const nextPanY = focalScreenY - worldBeforeY * nextZoom;

  return {
    panX: Math.round(nextPanX * 10) / 10,
    panY: Math.round(nextPanY * 10) / 10,
    zoom: nextZoom,
  };
}

/**
 * Calculate camera state that centers a given world coordinate in a viewport.
 */
export function centerCameraOnWorldPoint(
  worldX: number,
  worldY: number,
  viewportWidth: number,
  viewportHeight: number,
  targetZoom: number = 1
): CameraState {
  const zoom = clamp(targetZoom, MIN_ZOOM, MAX_ZOOM);
  return {
    panX: Math.round(viewportWidth / 2 - worldX * zoom),
    panY: Math.round(viewportHeight / 2 - worldY * zoom),
    zoom,
  };
}

/**
 * Compute camera state that fits all given spatial notes inside the viewport with padding.
 */
export function fitNotesToViewport(
  notes: SpatialNote[],
  viewportWidth: number,
  viewportHeight: number,
  paddingPx: number = 120
): CameraState {
  if (notes.length === 0) {
    return centerCameraOnWorldPoint(0, 0, viewportWidth, viewportHeight, 1);
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const n of notes) {
    const cardHeight = n.collapsed ? 76 : 230;
    if (n.x < minX) minX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.x + n.width > maxX) maxX = n.x + n.width;
    if (n.y + cardHeight > maxY) maxY = n.y + cardHeight;
  }

  const boundsWidth = Math.max(maxX - minX, 320);
  const boundsHeight = Math.max(maxY - minY, 240);

  const availW = Math.max(viewportWidth - paddingPx * 2, 240);
  const availH = Math.max(viewportHeight - paddingPx * 2, 200);

  const rawZoom = Math.min(availW / boundsWidth, availH / boundsHeight, 1.15);
  const zoom = clamp(Number(rawZoom.toFixed(2)), 0.35, 1.25);

  const centerX = minX + (maxX - minX) / 2;
  const centerY = minY + (maxY - minY) / 2;

  return centerCameraOnWorldPoint(
    centerX,
    centerY,
    viewportWidth,
    viewportHeight,
    zoom
  );
}

/**
 * Compute Euclidean distance between two points in world space and convert to cartographic meters
 * (10 world units = 1 meter scale).
 */
export function calculateCartographicDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { worldUnits: number; meters: number; bearingDeg: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const worldUnits = Math.hypot(dx, dy);
  const meters = Math.round(worldUnits / 2);
  // Compass bearing: 0 deg = North (up, -Y), 90 deg = East (+X), 180 = South (+Y), 270 = West (-X)
  const rawAngle = (Math.atan2(dx, -dy) * 180) / Math.PI;
  const bearingDeg = Math.round((rawAngle + 360) % 360);
  return {
    worldUnits: Math.round(worldUnits),
    meters,
    bearingDeg,
  };
}

/**
 * Format world X/Y coordinates into cartographic grid sector notation,
 * e.g. "SEC-B4 · +420E, -180N"
 */
export function formatGridCoordinate(worldX: number, worldY: number): {
  sector: string;
  eastWest: string;
  northSouth: string;
  compact: string;
} {
  const colIndex = Math.floor((worldX + 2000) / 500);
  const rowIndex = Math.floor((worldY + 2000) / 500);
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const colLetter =
    letters[clamp(colIndex, 0, letters.length - 1)] || 'M';
  const rowNum = clamp(rowIndex + 1, 1, 99);
  const sector = `${colLetter}${rowNum}`;

  const ewPrefix = worldX >= 0 ? `+${Math.round(worldX)}E` : `${Math.round(worldX)}W`;
  const nsPrefix = worldY <= 0 ? `+${Math.abs(Math.round(worldY))}N` : `-${Math.round(worldY)}S`;

  return {
    sector,
    eastWest: ewPrefix,
    northSouth: nsPrefix,
    compact: `${sector} · ${ewPrefix} ${nsPrefix}`,
  };
}

/**
 * Filter notes by search query, active category filter, and pinned-only toggle.
 */
export function filterSpatialNotes(
  notes: SpatialNote[],
  query: string,
  categoryFilter: NoteCategory | 'all',
  pinnedOnly: boolean = false
): SpatialNote[] {
  const normalizedQuery = query.trim().toLowerCase();

  return notes.filter((note) => {
    if (categoryFilter !== 'all' && note.category !== categoryFilter) {
      return false;
    }
    if (pinnedOnly && !note.pinned) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    const inTitle = note.title.toLowerCase().includes(normalizedQuery);
    const inContent = note.content.toLowerCase().includes(normalizedQuery);
    const inTags = note.tags.some((t) =>
      t.toLowerCase().includes(normalizedQuery)
    );
    const inChecklist = note.checklist.some((item) =>
      item.text.toLowerCase().includes(normalizedQuery)
    );
    return inTitle || inContent || inTags || inChecklist;
  });
}

/**
 * Snap coordinate to nearest grid increment when snap-to-grid is enabled.
 */
export function snapToGrid(value: number, gridSize: number = 20): number {
  return Math.round(value / gridSize) * gridSize;
}
