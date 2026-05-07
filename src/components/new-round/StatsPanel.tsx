interface Stats {
  score: number;
  pars: number;
  birdies: number;
  eagles: number;
  bogeys: number;
  doubleBogeys: number;
  triplePutts: number;
  penalties: number;
  putts: number;
  gir: number;
  fir: number;
  upAndDowns: number;
  sandSaves: number;
  girMissedUnder100: number;
  girMissed100to125: number;
  girMissed125to150: number;
  girMissed150to175: number;
  girMissedOver175: number;
}

interface StatsPanelProps {
  stats: Stats;
  onChange: (stats: Stats) => void;
}

interface StatOption {
  key: keyof Stats;
  label: string;
  min: number;
  max: number;
}

const leftStats: StatOption[] = [
  { key: 'score', label: 'Score', min: 60, max: 120 },
  { key: 'pars', label: 'Pars', min: 0, max: 18 },
  { key: 'birdies', label: 'Birdies', min: 0, max: 18 },
  { key: 'eagles', label: 'Eagles', min: 0, max: 5 },
  { key: 'bogeys', label: 'Bogeys', min: 0, max: 18 },
  { key: 'doubleBogeys', label: 'Double Bogeys+', min: 0, max: 18 },
  { key: 'triplePutts', label: '3 Putts', min: 0, max: 18 },
  { key: 'penalties', label: 'Penalties', min: 0, max: 18 },
  { key: 'putts', label: 'Putts', min: 18, max: 45 },
];

const rightStats: StatOption[] = [
  { key: 'gir', label: 'GIR', min: 0, max: 18 },
  { key: 'fir', label: 'FIR', min: 0, max: 18 },
  { key: 'upAndDowns', label: 'U&D', min: 0, max: 18 },
  { key: 'sandSaves', label: 'Sand Saves', min: 0, max: 10 },
];

const distanceMissedStats: StatOption[] = [
  { key: 'girMissedUnder100', label: '< 100 YDS', min: 0, max: 18 },
  { key: 'girMissed100to125', label: '100–125 YDS', min: 0, max: 18 },
  { key: 'girMissed125to150', label: '125–150 YDS', min: 0, max: 18 },
  { key: 'girMissed150to175', label: '150–175 YDS', min: 0, max: 18 },
  { key: 'girMissedOver175', label: '175+ YDS', min: 0, max: 18 },
];

function StatSelect({ option, value, onChange }: { option: StatOption; value: number; onChange: (v: number) => void }) {
  const options = Array.from({ length: option.max - option.min + 1 }, (_, i) => option.min + i);

  return (
    <div className="flex items-center gap-md">
      <label className="font-body text-small text-charcoal font-medium w-[140px] shrink-0">{option.label}</label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-[80px] px-sm py-xs rounded-sm border border-border-color bg-white font-body text-body text-forest font-semibold text-center focus:outline-none focus:border-forest focus:ring-[3px] focus:ring-[rgba(74,107,62,0.1)] transition-all duration-200 ease-smooth"
      >
        <option value="">—</option>
        {options.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function StatsPanel({ stats, onChange }: StatsPanelProps) {
  const handleChange = (key: keyof Stats, value: number) => {
    onChange({ ...stats, [key]: value });
  };

  return (
    <section className="bg-white rounded-md border border-border-color shadow-card p-lg">
      <div className="mb-md">
        <h2 className="font-display text-section-title text-forest">Round Statistics</h2>
        <p className="font-body text-small text-text-muted mt-xs">Select values from each dropdown.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        {/* Left Column */}
        <div className="flex flex-col gap-sm">
          {leftStats.map((opt) => (
            <StatSelect
              key={opt.key}
              option={opt}
              value={stats[opt.key]}
              onChange={(v) => handleChange(opt.key, v)}
            />
          ))}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-sm">
          {rightStats.map((opt) => (
            <StatSelect
              key={opt.key}
              option={opt}
              value={stats[opt.key]}
              onChange={(v) => handleChange(opt.key, v)}
            />
          ))}

          {/* Distance Missed Group */}
          <div className="mt-md">
            <div className="border-l-2 border-border-color pl-md">
              <p className="font-body text-small italic text-text-muted mb-sm">GIR Approach Missed</p>
              <div className="flex flex-col gap-sm">
                {distanceMissedStats.map((opt) => (
                  <StatSelect
                    key={opt.key}
                    option={opt}
                    value={stats[opt.key]}
                    onChange={(v) => handleChange(opt.key, v)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
