import test from 'node:test';
import assert from 'node:assert/strict';
import {
  screenToWorld,
  worldToScreen,
  zoomAroundScreenPoint,
  centerCameraOnWorldPoint,
  calculateCartographicDistance,
  formatGridCoordinate,
  filterSpatialNotes,
  snapToGrid,
  fitNotesToViewport,
} from './canvasMath';
import { SpatialNote } from '../types/atlas';

test('screenToWorld and worldToScreen are inverses at various zoom levels', () => {
  const camera = { panX: 450, panY: 320, zoom: 1.25 };
  const world = { x: 240, y: -160 };
  const screen = worldToScreen(world.x, world.y, camera);
  const roundTrip = screenToWorld(screen.x, screen.y, camera);

  assert.equal(roundTrip.x, world.x);
  assert.equal(roundTrip.y, world.y);
});

test('zoomAroundScreenPoint keeps the focal world point anchored under the cursor', () => {
  const initialCamera = { panX: 720, panY: 450, zoom: 1.0 };
  const cursorX = 920;
  const cursorY = 550;

  const beforeWorld = screenToWorld(cursorX, cursorY, initialCamera);
  const zoomedCamera = zoomAroundScreenPoint(initialCamera, 2.0, cursorX, cursorY);
  const afterWorld = screenToWorld(cursorX, cursorY, zoomedCamera);

  assert.equal(afterWorld.x, beforeWorld.x);
  assert.equal(afterWorld.y, beforeWorld.y);
  assert.equal(zoomedCamera.zoom, 2.0);
});

test('centerCameraOnWorldPoint places the world coordinate at viewport center', () => {
  const cam = centerCameraOnWorldPoint(300, -200, 1440, 900, 1.5);
  const screen = worldToScreen(300, -200, cam);
  assert.equal(screen.x, 720);
  assert.equal(screen.y, 450);
});

test('calculateCartographicDistance computes accurate Euclidean distance and bearing', () => {
  // Due East (+X): dx = 300, dy = 0 => 300 units, 150m, 90 deg
  const east = calculateCartographicDistance(0, 0, 300, 0);
  assert.equal(east.worldUnits, 300);
  assert.equal(east.meters, 150);
  assert.equal(east.bearingDeg, 90);

  // Due North (-Y): dx = 0, dy = -400 => 400 units, 200m, 0 deg
  const north = calculateCartographicDistance(0, 0, 0, -400);
  assert.equal(north.worldUnits, 400);
  assert.equal(north.meters, 200);
  assert.equal(north.bearingDeg, 0);
});

test('formatGridCoordinate returns valid sector code and directional strings', () => {
  const coord = formatGridCoordinate(250, -140);
  assert.ok(coord.sector.length >= 2);
  assert.equal(coord.eastWest, '+250E');
  assert.equal(coord.northSouth, '+140N');
});

test('filterSpatialNotes filters by query, category, and pinned status', () => {
  const sampleNotes: SpatialNote[] = [
    {
      id: 'n1',
      title: 'Northern Observatory',
      content: 'Primary triangulation station on Ridge Alpha.',
      category: 'landmark',
      color: 'blue',
      x: 0,
      y: 0,
      width: 300,
      pinned: true,
      collapsed: false,
      checklist: [{ id: 'c1', text: 'Calibrate optical transit', completed: true }],
      tags: ['survey', 'optics'],
      updatedAt: '2026-11-14',
    },
    {
      id: 'n2',
      title: 'Basalt Canyon Hazard',
      content: 'Unstable scree slope on western approach.',
      category: 'hazard',
      color: 'rose',
      x: 400,
      y: 200,
      width: 300,
      pinned: false,
      collapsed: false,
      checklist: [],
      tags: ['geology', 'caution'],
      updatedAt: '2026-11-14',
    },
  ];

  assert.equal(filterSpatialNotes(sampleNotes, 'calibrat', 'all').length, 1);
  assert.equal(filterSpatialNotes(sampleNotes, '', 'hazard').length, 1);
  assert.equal(filterSpatialNotes(sampleNotes, '', 'all', true).length, 1);
  assert.equal(filterSpatialNotes(sampleNotes, 'nonexistent', 'all').length, 0);
});

test('snapToGrid rounds coordinates to nearest grid step', () => {
  assert.equal(snapToGrid(213, 20), 220);
  assert.equal(snapToGrid(-108, 20), -100);
});

test('fitNotesToViewport returns valid camera state for populated and empty notes', () => {
  const emptyCam = fitNotesToViewport([], 1440, 900);
  assert.equal(emptyCam.zoom, 1);

  const notes: SpatialNote[] = [
    {
      id: 'n1',
      title: 'A',
      content: '',
      category: 'landmark',
      color: 'blue',
      x: -400,
      y: -300,
      width: 300,
      pinned: false,
      collapsed: false,
      checklist: [],
      tags: [],
      updatedAt: '2026-11-14',
    },
    {
      id: 'n2',
      title: 'B',
      content: '',
      category: 'landmark',
      color: 'blue',
      x: 500,
      y: 400,
      width: 300,
      pinned: false,
      collapsed: false,
      checklist: [],
      tags: [],
      updatedAt: '2026-11-14',
    },
  ];

  const fitCam = fitNotesToViewport(notes, 1440, 900);
  assert.ok(fitCam.zoom >= 0.25 && fitCam.zoom <= 1.25);
});
