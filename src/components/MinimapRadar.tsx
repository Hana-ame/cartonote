import React from 'react';
import { Compass, Maximize2 } from 'lucide-react';
import { CameraState, RouteConnection, SpatialNote } from '../types/atlas';
import { COLOR_SWATCHES } from '../data/seedAtlas';

interface MinimapRadarProps {
  notes: SpatialNote[];
  connections: RouteConnection[];
  camera: CameraState;
  viewportWidth: number;
  viewportHeight: number;
  selectedNoteId: string | null;
  onPanToWorldPoint: (worldX: number, worldY: number) => void;
  onFitAll: () => void;
}

const WORLD_MIN_X = -1400;
const WORLD_MAX_X = 1600;
const WORLD_MIN_Y = -1000;
const WORLD_MAX_Y = 1000;
const MAP_W = 208;
const MAP_H = 136;

export const MinimapRadar: React.FC<MinimapRadarProps> = ({
  notes,
  connections,
  camera,
  viewportWidth,
  viewportHeight,
  selectedNoteId,
  onPanToWorldPoint,
  onFitAll,
}) => {
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const [isDraggingMini, setIsDraggingMini] = React.useState(false);

  const worldToMini = (wx: number, wy: number) => {
    const nx = (wx - WORLD_MIN_X) / (WORLD_MAX_X - WORLD_MIN_X);
    const ny = (wy - WORLD_MIN_Y) / (WORLD_MAX_Y - WORLD_MIN_Y);
    return {
      x: nx * MAP_W,
      y: ny * MAP_H,
    };
  };

  const miniToWorld = (mx: number, my: number) => {
    const nx = mx / MAP_W;
    const ny = my / MAP_H;
    return {
      x: Math.round(WORLD_MIN_X + nx * (WORLD_MAX_X - WORLD_MIN_X)),
      y: Math.round(WORLD_MIN_Y + ny * (WORLD_MAX_Y - WORLD_MIN_Y)),
    };
  };

  // Current viewport world bounds
  const viewTopLeftWorldX = -camera.panX / camera.zoom;
  const viewTopLeftWorldY = -camera.panY / camera.zoom;
  const viewWorldW = viewportWidth / camera.zoom;
  const viewWorldH = viewportHeight / camera.zoom;

  const vpTopLeft = worldToMini(viewTopLeftWorldX, viewTopLeftWorldY);
  const vpBottomRight = worldToMini(
    viewTopLeftWorldX + viewWorldW,
    viewTopLeftWorldY + viewWorldH
  );

  const rectX = vpTopLeft.x;
  const rectY = vpTopLeft.y;
  const rectW = Math.max(vpBottomRight.x - vpTopLeft.x, 12);
  const rectH = Math.max(vpBottomRight.y - vpTopLeft.y, 10);

  const originMini = worldToMini(0, 0);

  const handlePointerEvent = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const bounds = svgRef.current.getBoundingClientRect();
    const mx = e.clientX - bounds.left;
    const my = e.clientY - bounds.top;
    const targetWorld = miniToWorld(mx, my);
    onPanToWorldPoint(targetWorld.x, targetWorld.y);
  };

  return (
    <aside
      aria-label="Cartographic Minimap Radar"
      className="rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-lg p-2.5 select-none"
    >
      <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Sector Radar</span>
        </div>
        <button
          type="button"
          onClick={onFitAll}
          aria-label="Fit all notes in viewport"
          className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
        >
          <Maximize2 className="w-3 h-3" />
          <span>Fit All</span>
        </button>
      </div>

      <svg
        ref={svgRef}
        width={MAP_W}
        height={MAP_H}
        onPointerDown={(e) => {
          e.stopPropagation();
          setIsDraggingMini(true);
          handlePointerEvent(e);
        }}
        onPointerMove={(e) => {
          if (!isDraggingMini) return;
          handlePointerEvent(e);
        }}
        onPointerUp={() => setIsDraggingMini(false)}
        onPointerLeave={() => setIsDraggingMini(false)}
        className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 cursor-pointer overflow-hidden block"
      >
        {/* Origin Crosshairs */}
        <line
          x1={0}
          y1={originMini.y}
          x2={MAP_W}
          y2={originMini.y}
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-800"
          strokeWidth="1"
        />
        <line
          x1={originMini.x}
          y1={0}
          x2={originMini.x}
          y2={MAP_H}
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-800"
          strokeWidth="1"
        />

        {/* Route Connections */}
        {connections.map((conn) => {
          const fromNote = notes.find((n) => n.id === conn.fromNoteId);
          const toNote = notes.find((n) => n.id === conn.toNoteId);
          if (!fromNote || !toNote) return null;
          const p1 = worldToMini(fromNote.x + 150, fromNote.y + 60);
          const p2 = worldToMini(toNote.x + 150, toNote.y + 60);
          return (
            <line
              key={conn.id}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#64748B"
              strokeWidth="1"
              strokeOpacity="0.5"
            />
          );
        })}

        {/* Spatial Note Dots */}
        {notes.map((n) => {
          const pt = worldToMini(n.x + 150, n.y + 60);
          const isSel = n.id === selectedNoteId;
          return (
            <circle
              key={n.id}
              cx={pt.x}
              cy={pt.y}
              r={isSel ? 4.5 : 3}
              fill={COLOR_SWATCHES[n.color].pinFill}
              stroke={isSel ? '#ffffff' : 'none'}
              strokeWidth={isSel ? 1.5 : 0}
            />
          );
        })}

        {/* Active Camera Viewport Frame */}
        <rect
          x={rectX}
          y={rectY}
          width={rectW}
          height={rectH}
          fill="rgba(37, 99, 235, 0.08)"
          stroke="#2563EB"
          strokeWidth="1.5"
          rx="2"
        />
      </svg>
    </aside>
  );
};
