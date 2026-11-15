import React from 'react';
import {
  MousePointer,
  Hand,
  MapPinPlus,
  Route,
  Ruler,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Maximize2,
  Grid,
  Magnet,
  Compass,
} from 'lucide-react';
import { ActiveTool, GridBackdropStyle } from '../types/atlas';

interface MapToolDockProps {
  activeTool: ActiveTool;
  gridStyle: GridBackdropStyle;
  snapEnabled: boolean;
  zoom: number;
  onSelectTool: (tool: ActiveTool) => void;
  onCycleGridStyle: () => void;
  onToggleSnap: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onCenterOrigin: () => void;
  onFitAll: () => void;
  onOpenMobileDirectory?: () => void;
}

const TOOLS: Array<{
  id: ActiveTool;
  label: string;
  shortcut: string;
  icon: React.FC<{ className?: string }>;
}> = [
  { id: 'select', label: 'Select & Move', shortcut: 'V', icon: MousePointer },
  { id: 'pan', label: 'Pan Canvas', shortcut: 'H', icon: Hand },
  { id: 'drop-note', label: 'Drop Note Pin', shortcut: 'N', icon: MapPinPlus },
  { id: 'connect-route', label: 'Link Route', shortcut: 'L', icon: Route },
  { id: 'measure', label: 'Measure Distance', shortcut: 'M', icon: Ruler },
];

export const MapToolDock: React.FC<MapToolDockProps> = ({
  activeTool,
  gridStyle,
  snapEnabled,
  zoom,
  onSelectTool,
  onCycleGridStyle,
  onToggleSnap,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onCenterOrigin,
  onFitAll,
  onOpenMobileDirectory,
}) => {
  const gridLabel =
    gridStyle === 'topographic'
      ? 'Topo Grid'
      : gridStyle === 'blueprint'
        ? 'Blueprint'
        : 'Dot Matrix';

  return (
    <div
      role="toolbar"
      aria-label="Cartographic Canvas Tools"
      className="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-0.5 md:gap-1 px-1.5 py-1.5 md:px-2.5 md:py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl select-none max-w-[calc(100%-1.5rem)]"
    >
      {/* Mobile-only Atlas Sheet Trigger in Thumb Zone */}
      {onOpenMobileDirectory && (
        <button
          type="button"
          onClick={onOpenMobileDirectory}
          aria-label="Open Atlas Waypoint Directory"
          title="Open Atlas Directory"
          className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors shrink-0"
        >
          <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </button>
      )}

      {/* Primary Spatial Interaction Modes */}
      <div className="flex items-center gap-0.5 md:gap-1 pr-1 md:pr-2 border-r border-slate-200 dark:border-slate-800">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelectTool(tool.id)}
              aria-label={`${tool.label} (${tool.shortcut})`}
              aria-pressed={isActive}
              title={`${tool.label} [${tool.shortcut}]`}
              className={`inline-flex items-center justify-center gap-1.5 w-9 h-9 md:w-auto md:h-auto md:px-2.5 md:py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 md:w-3.5 md:h-3.5 shrink-0" />
              <span className="hidden xl:inline">{tool.label}</span>
            </button>
          );
        })}
      </div>

      {/* Grid & Snap Toggles (Desktop & Tablet) */}
      <div className="hidden sm:flex items-center gap-1 pr-2 border-r border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onCycleGridStyle}
          aria-label={`Switch map backdrop style (current: ${gridLabel})`}
          title="Switch Map Backdrop Style"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          <Grid className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="hidden lg:inline">{gridLabel}</span>
        </button>

        <button
          type="button"
          onClick={onToggleSnap}
          aria-label="Toggle snap to grid"
          aria-pressed={snapEnabled}
          title="Snap notes to 20px coordinate grid"
          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
            snapEnabled
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Magnet className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Snap</span>
        </button>
      </div>

      {/* Camera & Zoom Controls */}
      <div className="flex items-center gap-0.5 md:gap-1">
        <button
          type="button"
          onClick={onZoomOut}
          aria-label="Zoom out"
          title="Zoom Out (-)"
          className="inline-flex items-center justify-center w-9 h-9 md:w-auto md:h-auto md:p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ZoomOut className="w-4 h-4 md:w-3.5 md:h-3.5" />
        </button>

        <button
          type="button"
          onClick={onResetZoom}
          aria-label={`Reset zoom (currently ${Math.round(zoom * 100)}%)`}
          title="Click to reset zoom to 100%"
          className="hidden sm:inline-flex px-2 py-1 rounded-lg text-xs font-mono tabular-nums font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          type="button"
          onClick={onZoomIn}
          aria-label="Zoom in"
          title="Zoom In (+)"
          className="inline-flex items-center justify-center w-9 h-9 md:w-auto md:h-auto md:p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ZoomIn className="w-4 h-4 md:w-3.5 md:h-3.5" />
        </button>

        <button
          type="button"
          onClick={onCenterOrigin}
          aria-label="Center on datum origin (0, 0)"
          title="Return to Origin (0E, 0N)"
          className="hidden sm:inline-flex p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Crosshair className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onFitAll}
          aria-label="Fit all notes on screen"
          title="Fit All Notes in Viewport"
          className="inline-flex items-center justify-center w-9 h-9 md:w-auto md:h-auto md:p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Maximize2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
        </button>
      </div>
    </div>
  );
};
