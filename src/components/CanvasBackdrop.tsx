import React from 'react';
import { CameraState, GridBackdropStyle } from '../types/atlas';

interface CanvasBackdropProps {
  camera: CameraState;
  gridStyle: GridBackdropStyle;
  isDark: boolean;
}

/**
 * Renders the infinite panning & zooming cartographic background grid,
 * major/minor coordinate lines, origin crosshairs, and topographic contour rings.
 */
export const CanvasBackdrop: React.FC<CanvasBackdropProps> = ({
  camera,
  gridStyle,
  isDark,
}) => {
  const minorGridSize = 40 * camera.zoom;
  const majorGridSize = 200 * camera.zoom;

  const offsetXMinor = ((camera.panX % minorGridSize) + minorGridSize) % minorGridSize;
  const offsetYMinor = ((camera.panY % minorGridSize) + minorGridSize) % minorGridSize;

  const offsetXMajor = ((camera.panX % majorGridSize) + majorGridSize) % majorGridSize;
  const offsetYMajor = ((camera.panY % majorGridSize) + majorGridSize) % majorGridSize;

  const minorStroke = isDark
    ? gridStyle === 'blueprint'
      ? 'rgba(56, 189, 248, 0.08)'
      : 'rgba(148, 163, 184, 0.07)'
    : gridStyle === 'blueprint'
      ? 'rgba(37, 99, 235, 0.09)'
      : 'rgba(15, 23, 42, 0.05)';

  const majorStroke = isDark
    ? gridStyle === 'blueprint'
      ? 'rgba(56, 189, 248, 0.18)'
      : 'rgba(148, 163, 184, 0.14)'
    : gridStyle === 'blueprint'
      ? 'rgba(37, 99, 235, 0.18)'
      : 'rgba(15, 23, 42, 0.11)';

  const dotColor = isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(71, 85, 105, 0.28)';

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full select-none"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="carto-minor-grid"
          width={Math.max(minorGridSize, 8)}
          height={Math.max(minorGridSize, 8)}
          patternUnits="userSpaceOnUse"
          patternTransform={`translate(${offsetXMinor}, ${offsetYMinor})`}
        >
          {gridStyle === 'dot-matrix' ? (
            <circle cx={1.5} cy={1.5} r={1.25} fill={dotColor} />
          ) : (
            <path
              d={`M ${Math.max(minorGridSize, 8)} 0 L 0 0 0 ${Math.max(minorGridSize, 8)}`}
              fill="none"
              stroke={minorStroke}
              strokeWidth="1"
            />
          )}
        </pattern>

        <pattern
          id="carto-major-grid"
          width={Math.max(majorGridSize, 32)}
          height={Math.max(majorGridSize, 32)}
          patternUnits="userSpaceOnUse"
          patternTransform={`translate(${offsetXMajor}, ${offsetYMajor})`}
        >
          <path
            d={`M ${Math.max(majorGridSize, 32)} 0 L 0 0 0 ${Math.max(majorGridSize, 32)}`}
            fill="none"
            stroke={majorStroke}
            strokeWidth="1"
          />
        </pattern>
      </defs>

      {/* Infinite minor and major grids */}
      <rect width="100%" height="100%" fill="url(#carto-minor-grid)" />
      <rect width="100%" height="100%" fill="url(#carto-major-grid)" />

      {/* World-space topographic contour features & datum axes */}
      <g
        transform={`translate(${camera.panX}, ${camera.panY}) scale(${camera.zoom})`}
      >
        {gridStyle === 'topographic' && (
          <g
            fill="none"
            stroke={
              isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(100, 116, 139, 0.14)'
            }
            strokeWidth={1.25 / camera.zoom}
          >
            {/* Northern Solstice Ridge Contours */}
            <ellipse cx={450} cy={-280} rx={360} ry={180} />
            <ellipse cx={460} cy={-285} rx={260} ry={125} strokeDasharray="6 4" />
            <ellipse cx={470} cy={-290} rx={155} ry={70} />

            {/* Western Basin Contours */}
            <ellipse cx={-480} cy={20} rx={310} ry={210} />
            <ellipse cx={-490} cy={15} rx={210} ry={135} strokeDasharray="4 4" />

            {/* Eastern Hydro Gorge Contours */}
            <ellipse cx={580} cy={220} rx={340} ry={190} />
            <ellipse cx={590} cy={225} rx={220} ry={115} />
          </g>
        )}

        {/* Primary World Origin Axes (X=0, Y=0) */}
        <line
          x1={-10000}
          y1={0}
          x2={10000}
          y2={0}
          stroke={isDark ? 'rgba(59, 130, 246, 0.26)' : 'rgba(37, 99, 235, 0.22)'}
          strokeWidth={1.5 / camera.zoom}
          strokeDasharray={`${8 / camera.zoom} ${6 / camera.zoom}`}
        />
        <line
          x1={0}
          y1={-10000}
          x2={0}
          y2={10000}
          stroke={isDark ? 'rgba(59, 130, 246, 0.26)' : 'rgba(37, 99, 235, 0.22)'}
          strokeWidth={1.5 / camera.zoom}
          strokeDasharray={`${8 / camera.zoom} ${6 / camera.zoom}`}
        />

        {/* Origin Datum Target Marker (0, 0) */}
        <circle
          cx={0}
          cy={0}
          r={24}
          fill="none"
          stroke={isDark ? 'rgba(96, 165, 250, 0.45)' : 'rgba(37, 99, 235, 0.4)'}
          strokeWidth={1.5 / camera.zoom}
        />
        <circle
          cx={0}
          cy={0}
          r={4}
          fill={isDark ? 'rgba(96, 165, 250, 0.7)' : 'rgba(37, 99, 235, 0.65)'}
        />
      </g>
    </svg>
  );
};
