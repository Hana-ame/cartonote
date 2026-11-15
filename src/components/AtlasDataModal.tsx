import React from 'react';
import { X, Copy, Check, RotateCcw, Upload } from 'lucide-react';
import {
  RouteConnection,
  SpatialNote,
  ViewportBookmark,
} from '../types/atlas';

interface AtlasDataModalProps {
  isOpen: boolean;
  notes: SpatialNote[];
  connections: RouteConnection[];
  bookmarks: ViewportBookmark[];
  onClose: () => void;
  onImportAtlas: (data: {
    notes: SpatialNote[];
    connections: RouteConnection[];
    bookmarks: ViewportBookmark[];
  }) => void;
  onResetToDefault: () => void;
}

export const AtlasDataModal: React.FC<AtlasDataModalProps> = ({
  isOpen,
  notes,
  connections,
  bookmarks,
  onClose,
  onImportAtlas,
  onResetToDefault,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [importJsonText, setImportJsonText] = React.useState('');
  const [importError, setImportError] = React.useState('');

  if (!isOpen) return null;

  const exportPayload = JSON.stringify(
    {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      notes,
      connections,
      bookmarks,
    },
    null,
    2
  );

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(exportPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = importJsonText.trim();
    if (!raw) {
      setImportError('Paste valid CartoNote JSON data before importing.');
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.notes)) {
        setImportError('Invalid JSON format: missing "notes" array.');
        return;
      }
      onImportAtlas({
        notes: parsed.notes,
        connections: Array.isArray(parsed.connections)
          ? parsed.connections
          : [],
        bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
      });
      setImportJsonText('');
      setImportError('');
      onClose();
    } catch {
      setImportError('Could not parse JSON. Check syntax and try again.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="atlas-data-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2
            id="atlas-data-modal-title"
            className="text-base font-semibold text-slate-900 dark:text-slate-100"
          >
            Atlas Data & Portability
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Atlas Data modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Export Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Export Current Spatial Atlas ({notes.length} waypoints,{' '}
                {connections.length} routes)
              </span>
              <button
                type="button"
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied JSON</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              readOnly
              rows={5}
              value={exportPayload}
              aria-label="Exported Atlas JSON"
              className="w-full p-3 text-[11px] font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 focus:outline-none"
            />
          </div>

          {/* Import Section */}
          <form onSubmit={handleImportSubmit} className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <label
              htmlFor="import-atlas-json"
              className="block text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              Import Spatial Atlas JSON
            </label>
            {importError && (
              <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
                {importError}
              </p>
            )}
            <textarea
              id="import-atlas-json"
              rows={4}
              value={importJsonText}
              onChange={(e) => {
                setImportJsonText(e.target.value);
                if (importError) setImportError('');
              }}
              placeholder='Paste CartoNote JSON payload ({"notes": [...], "connections": [...]})...'
              className="w-full p-3 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
            />
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  onResetToDefault();
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Demo Survey Map</span>
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Load Atlas JSON</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
