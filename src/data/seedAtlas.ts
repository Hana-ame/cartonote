import {
  NoteCategory,
  NoteColor,
  RouteConnection,
  SpatialNote,
  ViewportBookmark,
} from '../types/atlas';

export const CATEGORY_META: Record<
  NoteCategory,
  { label: string; shortCode: string; accentClass: string; dotColor: string }
> = {
  landmark: {
    label: 'Landmark',
    shortCode: 'LMK',
    accentClass: 'text-blue-600 dark:text-blue-400',
    dotColor: '#2563EB',
  },
  'field-note': {
    label: 'Field Note',
    shortCode: 'FLD',
    accentClass: 'text-emerald-600 dark:text-emerald-400',
    dotColor: '#059669',
  },
  milestone: {
    label: 'Milestone',
    shortCode: 'MLS',
    accentClass: 'text-amber-600 dark:text-amber-400',
    dotColor: '#D97706',
  },
  hazard: {
    label: 'Caution Zone',
    shortCode: 'HAZ',
    accentClass: 'text-rose-600 dark:text-rose-400',
    dotColor: '#E11D48',
  },
  architecture: {
    label: 'Architecture',
    shortCode: 'ARC',
    accentClass: 'text-violet-600 dark:text-violet-400',
    dotColor: '#7C3AED',
  },
};

export const COLOR_SWATCHES: Record<
  NoteColor,
  {
    name: string;
    hex: string;
    headerBg: string;
    pinFill: string;
    borderSelected: string;
  }
> = {
  slate: {
    name: 'Graphite Slate',
    hex: '#475569',
    headerBg: 'bg-slate-100/90 dark:bg-slate-800/90',
    pinFill: '#475569',
    borderSelected: 'ring-2 ring-slate-600 dark:ring-slate-300',
  },
  blue: {
    name: 'Cobalt Meridian',
    hex: '#2563EB',
    headerBg: 'bg-blue-50/90 dark:bg-blue-950/60',
    pinFill: '#2563EB',
    borderSelected: 'ring-2 ring-blue-600 dark:ring-blue-400',
  },
  emerald: {
    name: 'Alpine Veridian',
    hex: '#059669',
    headerBg: 'bg-emerald-50/90 dark:bg-emerald-950/60',
    pinFill: '#059669',
    borderSelected: 'ring-2 ring-emerald-600 dark:ring-emerald-400',
  },
  amber: {
    name: 'Saffron Beacon',
    hex: '#D97706',
    headerBg: 'bg-amber-50/90 dark:bg-amber-950/60',
    pinFill: '#D97706',
    borderSelected: 'ring-2 ring-amber-600 dark:ring-amber-400',
  },
  rose: {
    name: 'Crimson Fault',
    hex: '#E11D48',
    headerBg: 'bg-rose-50/90 dark:bg-rose-950/60',
    pinFill: '#E11D48',
    borderSelected: 'ring-2 ring-rose-600 dark:ring-rose-400',
  },
  violet: {
    name: 'Ultraviolet Relay',
    hex: '#7C3AED',
    headerBg: 'bg-violet-50/90 dark:bg-violet-950/60',
    pinFill: '#7C3AED',
    borderSelected: 'ring-2 ring-violet-600 dark:ring-violet-400',
  },
};

export const INITIAL_SPATIAL_NOTES: SpatialNote[] = [
  {
    id: 'note-origin-hub',
    title: 'Meridian Basecamp & Spatial Index',
    content:
      'Central zero-point reference station (0E, 0N). Drag the canvas anywhere to explore sectors, double-click empty terrain to drop a new spatial note pin, or connect notes using the Route Link tool.',
    category: 'landmark',
    color: 'blue',
    x: -160,
    y: -140,
    width: 320,
    pinned: true,
    collapsed: false,
    elevationMeters: 420,
    checklist: [
      { id: 'chk-1', text: 'Verify datum origin calibration (0, 0)', completed: true },
      { id: 'chk-2', text: 'Establish northern ridge telemetry link', completed: true },
      { id: 'chk-3', text: 'Review eastern hydro-basin survey notes', completed: false },
    ],
    tags: ['origin', 'hq', 'index'],
    updatedAt: '2026-11-14 09:30',
  },
  {
    id: 'note-north-observatory',
    title: 'Solstice Ridge Optical Array',
    content:
      'High-altitude atmospheric and stellar observation post perched along the northern contour shelf. Unobstructed 360-degree horizon line with low thermal turbulence.',
    category: 'architecture',
    color: 'violet',
    x: 320,
    y: -380,
    width: 300,
    pinned: true,
    collapsed: false,
    elevationMeters: 1180,
    checklist: [
      { id: 'chk-4', text: 'Mount primary mirror housing', completed: true },
      { id: 'chk-5', text: 'Run laser rangefinder test to Basecamp', completed: false },
    ],
    tags: ['optics', 'north-ridge', 'telemetry'],
    updatedAt: '2026-11-14 11:15',
  },
  {
    id: 'note-west-botanical',
    title: 'Sub-Alpine Lichen & Flora Transect',
    content:
      'Sampled 14 quadrats across the western granite outcroppings. High density of Rhizocarpon geographicum indicates stable periglacial microclimate over 400+ years.',
    category: 'field-note',
    color: 'emerald',
    x: -620,
    y: -60,
    width: 300,
    pinned: false,
    collapsed: false,
    elevationMeters: 690,
    checklist: [
      { id: 'chk-6', text: 'Catalog spore specimens #104-#118', completed: true },
      { id: 'chk-7', text: 'Log soil moisture profile at -600W', completed: true },
    ],
    tags: ['botany', 'transect', 'west-sector'],
    updatedAt: '2026-11-14 13:40',
  },
  {
    id: 'note-east-aquifer',
    title: 'Basalt Gorge Hydrological Station',
    content:
      'Artesian spring discharge measured at 42.8 L/s with high dissolved silica clarity. Ideal location for secondary micro-hydro turbine and water filtration depot.',
    category: 'milestone',
    color: 'amber',
    x: 420,
    y: 120,
    width: 310,
    pinned: true,
    collapsed: false,
    elevationMeters: 310,
    checklist: [
      { id: 'chk-8', text: 'Deploy acoustic flowmeter sensor', completed: true },
      { id: 'chk-9', text: 'Verify pH and conductivity baseline', completed: false },
    ],
    tags: ['hydrology', 'energy', 'east-gorge'],
    updatedAt: '2026-11-14 15:05',
  },
  {
    id: 'note-south-fissure',
    title: 'Shear Zone & Loose Talus Traverse',
    content:
      'Steep 38-degree scree incline along the southern rim. Recommend anchoring fixed guide cables before transporting heavy core-drilling cases across this corridor.',
    category: 'hazard',
    color: 'rose',
    x: -120,
    y: 310,
    width: 300,
    pinned: false,
    collapsed: false,
    elevationMeters: 275,
    checklist: [
      { id: 'chk-10', text: 'Install titanium rock pitons at 50m intervals', completed: false },
      { id: 'chk-11', text: 'Mark bypass trail on sector map', completed: true },
    ],
    tags: ['geology', 'safety', 'south-rim'],
    updatedAt: '2026-11-14 16:20',
  },
  {
    id: 'note-far-east-relay',
    title: 'Outpost Kestrel LoRa Mesh Repeater',
    content:
      'Solar-powered packet radio repeater extending mesh coverage across the eastern valley shadow. Operating at 915 MHz with +14 dBi directional yagi antenna.',
    category: 'architecture',
    color: 'slate',
    x: 920,
    y: -140,
    width: 290,
    pinned: false,
    collapsed: false,
    elevationMeters: 840,
    checklist: [
      { id: 'chk-12', text: 'Confirm RSSI > -85 dBm from Solstice Ridge', completed: true },
    ],
    tags: ['radio', 'mesh', 'solar'],
    updatedAt: '2026-11-14 17:45',
  },
];

export const INITIAL_CONNECTIONS: RouteConnection[] = [
  {
    id: 'conn-1',
    fromNoteId: 'note-origin-hub',
    toNoteId: 'note-north-observatory',
    label: 'Primary Optical Line',
    style: 'solid',
  },
  {
    id: 'conn-2',
    fromNoteId: 'note-origin-hub',
    toNoteId: 'note-west-botanical',
    label: 'Western Survey Trail',
    style: 'dashed',
  },
  {
    id: 'conn-3',
    fromNoteId: 'note-origin-hub',
    toNoteId: 'note-east-aquifer',
    label: 'Aquifer Pipeline Route',
    style: 'solid',
  },
  {
    id: 'conn-4',
    fromNoteId: 'note-origin-hub',
    toNoteId: 'note-south-fissure',
    label: 'Southern Perimeter Path',
    style: 'dashed',
  },
  {
    id: 'conn-5',
    fromNoteId: 'note-north-observatory',
    toNoteId: 'note-far-east-relay',
    label: '915 MHz Telemetry Hop',
    style: 'solid',
  },
];

export const INITIAL_BOOKMARKS: ViewportBookmark[] = [
  {
    id: 'bm-origin',
    name: 'Meridian Basecamp (Origin)',
    worldX: 0,
    worldY: 0,
    zoom: 1,
    sectorCode: 'E5',
  },
  {
    id: 'bm-north',
    name: 'Solstice Ridge & Relay',
    worldX: 600,
    worldY: -260,
    zoom: 0.9,
    sectorCode: 'F4',
  },
  {
    id: 'bm-west',
    name: 'Western Flora Transect',
    worldX: -480,
    worldY: -40,
    zoom: 1.05,
    sectorCode: 'C4',
  },
  {
    id: 'bm-south-east',
    name: 'Hydro Gorge & Talus Rim',
    worldX: 180,
    worldY: 240,
    zoom: 0.95,
    sectorCode: 'E5',
  },
];
