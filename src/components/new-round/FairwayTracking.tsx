import { useCallback } from 'react';
import {
  DndContext,
  type DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { RefreshCw } from 'lucide-react';
import HoleToken from './HoleToken';

interface FairwayTrackingProps {
  placements: Record<number, { x: number; y: number }>;
  onChange: (placements: Record<number, { x: number; y: number }>) => void;
}

const HOLES = Array.from({ length: 18 }, (_, i) => i + 1);

export default function FairwayTracking({ placements, onChange }: FairwayTrackingProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta } = event;
      if (!active?.data?.current?.hole || !delta) return;

      const hole = active.data.current.hole as number;

      // Find the fairway container to compute relative percentage
      const container = document.getElementById('fairway-drop-zone');
      if (!container) return;

      const rect = container.getBoundingClientRect();

      // Compute current absolute position from the delta and the original placement
      const original = placements[hole];
      let currentX: number;
      let currentY: number;

      if (original) {
        currentX = rect.left + rect.width * (original.x / 100) + delta.x;
        currentY = rect.top + rect.height * (original.y / 100) + delta.y;
      } else {
        // Token was in the tray; we need to know where it started visually.
        // Since tokens in the tray aren't placed, we can't easily know their start position.
        // We'll approximate by placing at center of container if dropped from tray.
        const tokenEl = document.querySelector(`[data-hole="${hole}"]`) as HTMLElement | null;
        if (tokenEl) {
          const tokenRect = tokenEl.getBoundingClientRect();
          currentX = tokenRect.left + tokenRect.width / 2 + delta.x;
          currentY = tokenRect.top + tokenRect.height / 2 + delta.y;
        } else {
          currentX = rect.left + rect.width / 2 + delta.x;
          currentY = rect.top + rect.height / 2 + delta.y;
        }
      }

      const xPct = Math.max(2, Math.min(98, ((currentX - rect.left) / rect.width) * 100));
      const yPct = Math.max(2, Math.min(98, ((currentY - rect.top) / rect.height) * 100));

      onChange({ ...placements, [hole]: { x: xPct, y: yPct } });
    },
    [placements, onChange]
  );

  const handleReset = () => {
    onChange({});
  };

  const placedHoles = new Set(Object.keys(placements).map(Number));
  const trayHoles = HOLES.filter((h) => !placedHoles.has(h));

  return (
    <section className="bg-white rounded-md border border-border-color shadow-card p-lg">
      <div className="flex items-center justify-between mb-md">
        <div>
          <h2 className="font-display text-section-title text-forest">Fairway Position</h2>
          <p className="font-body text-small text-text-muted mt-xs">
            Drag hole numbers to where your tee shot landed.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-md py-sm rounded-sm border border-border-color font-body text-small text-charcoal hover:bg-sand transition-colors duration-150 ease-smooth"
        >
          <RefreshCw className="w-4 h-4" />
          Reset Fairway
        </button>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {/* Fairway Illustration with drop area */}
        <div
          id="fairway-drop-zone"
          className="relative w-full overflow-hidden rounded-md"
          style={{ aspectRatio: '2 / 1', minHeight: '300px' }}
        >
          <img
            src="/fairway-illustration.png"
            alt="Fairway"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Zone overlays */}
          <div className="absolute inset-0 flex">
            <div className="flex-1 flex flex-col items-center justify-end pb-3 bg-[rgba(176,196,201,0.25)] border-r border-white/20">
              <span className="font-body text-small italic text-text-muted">Left Trouble</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-end pb-3 bg-[rgba(163,184,153,0.35)] border-r border-white/20">
              <span className="font-body text-small italic text-text-muted">Left Rough</span>
            </div>
            <div className="flex-[2.5] flex flex-col items-center justify-end pb-3 bg-[rgba(197,216,184,0.35)] border-r border-white/20">
              <span className="font-body text-small italic text-text-muted">Fairway</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-end pb-3 bg-[rgba(163,184,153,0.35)] border-r border-white/20">
              <span className="font-body text-small italic text-text-muted">Right Rough</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-end pb-3 bg-[rgba(176,196,201,0.25)]">
              <span className="font-body text-small italic text-text-muted">Right Trouble</span>
            </div>
          </div>

          {/* Placed tokens */}
          {Object.entries(placements).map(([holeStr, pos]) => {
            const hole = Number(holeStr);
            return (
              <div
                key={hole}
                className="absolute"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                data-hole={hole}
              >
                <HoleToken hole={hole} />
              </div>
            );
          })}
        </div>

        {/* Token tray */}
        {trayHoles.length > 0 && (
          <div className="mt-md bg-sand rounded-md p-md">
            <p className="font-body text-small text-text-muted mb-sm">Unplaced Holes</p>
            <div className="flex flex-wrap gap-sm">
              {trayHoles.map((hole) => (
                <div key={hole} data-hole={hole}>
                  <HoleToken hole={hole} />
                </div>
              ))}
            </div>
          </div>
        )}
      </DndContext>
    </section>
  );
}
