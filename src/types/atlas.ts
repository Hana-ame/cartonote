export type NoteCategory =
  | 'landmark'
  | 'field-note'
  | 'milestone'
  | 'hazard'
  | 'architecture';

export type NoteColor =
  | 'slate'
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'violet';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface SpatialNote {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  color: NoteColor;
  /** World X coordinate in canvas units */
  x: number;
  /** World Y coordinate in canvas units */
  y: number;
  width: number;
  pinned: boolean;
  collapsed: boolean;
  checklist: ChecklistItem[];
  tags: string[];
  updatedAt: string;
  elevationMeters?: number;
}

export interface RouteConnection {
  id: string;
  fromNoteId: string;
  toNoteId: string;
  label: string;
  style: 'solid' | 'dashed';
}

export interface ViewportBookmark {
  id: string;
  name: string;
  /** World center X */
  worldX: number;
  /** World center Y */
  worldY: number;
  zoom: number;
  sectorCode: string;
}

export interface CameraState {
  /** Screen pan offset X in pixels */
  panX: number;
  /** Screen pan offset Y in pixels */
  panY: number;
  /** Zoom scale factor (0.25 to 2.5) */
  zoom: number;
}

export type ActiveTool =
  | 'select'
  | 'pan'
  | 'drop-note'
  | 'connect-route'
  | 'measure';

export type GridBackdropStyle = 'topographic' | 'blueprint' | 'dot-matrix';
