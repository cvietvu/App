import { useCallback, useState } from 'react';
import {
  DndContext,
  type DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { RefreshCw, X } from 'lucide-react';
import HoleToken from './HoleToken';

export interface ApproachPlacement {
  x: number;
  y: number;
  distance: number;
}

interface ApproachTrackingProps {
  placements: Record<number, ApproachPlacement>;
  onChange: (placements: Record<number, ApproachPlacement>) => void;
}

const HOLES = Array.from({ length: 18 }, (_, i) => i + 1);

function getDirectionLabel(x: number, y: number): string {
  const dirs: string[] = [];
  if (y < 45) dirs.push('Long');
  else if (y > 55) dirs.push('Short');
  if (x < 45) dirs.push('Left');
  else if (x > 55) dirs.push('Right');
  return dirs.join('-') || 'Center';
}

export default function ApproachTracking({ placements, onChange }: ApproachTrackingProps) {
  const [openDistanceHole, setOpenDistanceHole] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta } = event;
      if (!active?.data?.current?.hole || !delta) return;

      const hole = active.data.current.hole as number;
      const container = document.getElementById('approach-drop-zone');
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const original = placements[hole];

      let currentX: number;
      let currentY: number;

      if (original) {
        currentX = rect.left + rect.width * (original.x / 100) + delta.x;
        currentY = rect.top + rect.height * (original.y / 100) + delta.y;
      } else {
        const tokenEl = document.querySelector(`[data-approach-hole="${hole}"]`) as HTMLElement | null;
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

      const distance = original?.distance ?? 0;
      onChange({ ...placements, [hole]: { x: xPct, y: yPct, distance } });
    },
    [placements, onChange]
  );

  const handleDistanceChange = (hole: number, distance: number) => {
    const p = placements[hole];
    if (!p) return;
    onChange({ ...placements, [hole]: { ...p, distance } });
    setOpenDistanceHole(null);
  };

  const handleRemove = (hole: number) => {
    const next = { ...placements };
    delete next[hole];
    onChange(next);
  };

  const handleReset = () => {
    onChange({});
  };

  const placedHoles = new Set(Object.keys(placements).map(Number));
  const trayHoles = HOLES.filter((h) => !placedHoles.has(h));

  const distanceOptions = Array.from({ length: 100 }, (_, i) => i + 1);

  return (
    <section className="bg-white rounded-md border border-border-color shadow-card p-lg">
      <div className="flex items-center justify-between mb-md">
        <div>
          <h2 className="font-display text-section-title text-forest">Approach &amp; Green</h2>
          <p className="font-body text-small text-text-muted mt-xs">
            Drag hole numbers and set approach distance.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-md py-sm rounded-sm border border-border-color font-body text-small text-charcoal hover:bg-sand transition-colors duration-150 ease-smooth"
        >
          <RefreshCw className="w-4 h-4" />
          Reset Approach
        </button>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex flex-col lg:flex-row gap-lg">
          {/* Green Illustration */}
          <div className="lg:w-3/5 w-full">
            <div
              id="approach-drop-zone"
              className="relative w-full overflow-hidden rounded-md"
              style={{ aspectRatio: '3 / 2', minHeight: '280px' }}
            >
              <img
                src="/green-illustration.png"
                alt="Green"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Zone overlays */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[60%] h-[60%] rounded-full border-2 border-dashed border-forest/30 flex items-center justify-center">
                  <span className="font-body text-small text-text-muted bg-white/70 px-2 py-1 rounded-sm">Green</span>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[80%] h-[80%] rounded-full border-2 border-dashed border-rough/40" />
              </div>
              <div className="absolute top-2 left-2 pointer-events-none">
                <span className="font-body text-small text-text-muted bg-white/70 px-2 py-1 rounded-sm">Approach Area</span>
              </div>
              <div className="absolute bottom-2 right-2 pointer-events-none">
                <span className="font-body text-small text-text-muted bg-white/70 px-2 py-1 rounded-sm">Fringe</span>
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
                    data-approach-hole={hole}
                  >
                    <HoleToken hole={hole} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Token tray + placed hole controls */}
          <div className="lg:w-2/5 w-full flex flex-col gap-md">
            {trayHoles.length > 0 && (
              <div className="bg-sand rounded-md p-md">
                <p className="font-body text-small text-text-muted mb-sm">Unplaced Holes</p>
                <div className="flex flex-wrap gap-sm">
                  {trayHoles.map((hole) => (
                    <div key={hole} data-approach-hole={hole}>
                      <HoleToken hole={hole} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {placedHoles.size > 0 && (
              <div className="bg-white rounded-md border border-border-color p-md flex-1 overflow-y-auto max-h-[320px]">
                <p className="font-body text-small text-text-muted mb-sm">Placed Holes</p>
                <div className="flex flex-col gap-sm">
                  {Object.entries(placements).map(([holeStr, pos]) => {
                    const hole = Number(holeStr);
                    const direction = getDirectionLabel(pos.x, pos.y);
                    const isOpen = openDistanceHole === hole;
                    return (
                      <div
                        key={hole}
                        className="flex items-center gap-sm p-sm rounded-sm border border-border-color hover:border-fairway transition-colors duration-150 ease-smooth"
                      >
                        <div className="w-7 h-7 rounded-full bg-green-light border border-forest flex items-center justify-center font-body text-xs font-bold text-forest">
                          {hole}
                        </div>
                        <span className="font-body text-small text-text-muted bg-sand px-2 py-0.5 rounded-full">
                          {direction}
                        </span>

                        {/* Distance dropdown */}
                        <div className="relative ml-auto">
                          <button
                            onClick={() => setOpenDistanceHole(isOpen ? null : hole)}
                            className="px-sm py-xs rounded-sm border border-border-color bg-white font-body text-small text-forest font-semibold hover:bg-sand transition-colors duration-150 ease-smooth min-w-[70px] text-center"
                          >
                            {pos.distance > 0 ? `${pos.distance} ft` : 'Select ft'}
                          </button>
                          {isOpen && (
                            <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-border-color rounded-md shadow-card-hover max-h-[240px] overflow-y-auto w-[80px]">
                              <div className="p-xs">
                                {distanceOptions.map((d) => (
                                  <button
                                    key={d}
                                    onClick={() => handleDistanceChange(hole, d)}
                                    className={`w-full text-left px-sm py-xs rounded-sm font-body text-small transition-colors duration-100 ${
                                      pos.distance === d
                                        ? 'bg-green-light text-forest font-semibold'
                                        : 'hover:bg-sand text-charcoal'
                                    }`}
                                  >
                                    {d} ft
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleRemove(hole)}
                          className="ml-1 p-1 rounded-sm hover:bg-sand text-text-muted hover:text-flag-red transition-colors duration-150 ease-smooth"
                          aria-label={`Remove hole ${hole}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </DndContext>
    </section>
  );
}
