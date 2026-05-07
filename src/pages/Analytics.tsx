import { useState, useEffect, useMemo, useCallback } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  Trophy,
  TrendingDown,
  Flag,
  Target,
  Download,
  Calendar,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  BarChart3,
  Plus,
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  ComposedChart,
} from 'recharts'
import { Link } from 'react-router-dom'

// ─── Types ───────────────────────────────────────────────────────────

interface RoundStats {
  score: number
  pars: number
  birdies: number
  eagles: number
  bogeys: number
  doubleBogeys: number
  triplePutts: number
  penalties: number
  putts: number
  gir: number
  fir: number
  upAndDowns: number
  sandSaves: number
  girMissedUnder100: number
  girMissed100to125: number
  girMissed125to150: number
  girMissed150to175: number
  girMissedOver175: number
}

interface StoredRound {
  id: string
  date: string
  course: string
  teeTime?: string
  stockShotShape?: string
  goals?: string
  fairwayPlacements?: Record<number, { x: number; y: number }>
  approachPlacements?: Record<number, { x: number; y: number; distance: number }>
  stats?: RoundStats
  notes?: string
  score?: number
  par?: number
}

interface NormalizedRound {
  id: string
  date: string
  course: string
  score: number
  par: number
  putts: number
  gir: number
  fir: number
  pars: number
  birdies: number
  eagles: number
  bogeys: number
  doubleBogeys: number
  triplePutts: number
  girMissedUnder100: number
  girMissed100to125: number
  girMissed125to150: number
  girMissed150to175: number
  girMissedOver175: number
  fairwayPlacements?: Record<number, { x: number; y: number }>
}

interface ChartPoint {
  date: string
  label: string
  value: number
  [key: string]: string | number
}

// ─── Constants ───────────────────────────────────────────────────────

const ROUNDS_KEY = 'golfer-blueprint-rounds'

const COLORS = {
  forest: '#4A6B3E',
  fairway: '#C5D8B8',
  flag: '#C45B4A',
  gold: '#D4A843',
  sky: '#B0C4C9',
  sand: '#E8DDD0',
  greenLight: '#D8E8CE',
  border: '#D4CFC7',
  textMuted: '#7A7A7A',
  white: '#FFFFFF',
  rough: '#A3B899',
  charcoal: '#2E2E2E',
}

const TIME_RANGES = [
  { key: '5' as const, label: 'Last 5' },
  { key: '10' as const, label: 'Last 10' },
  { key: '30' as const, label: 'Last 30 Days' },
  { key: '180' as const, label: 'Last 6 Months' },
  { key: 'all' as const, label: 'All Time' },
]

type TimeRange = (typeof TIME_RANGES)[number]['key']

// ─── Helpers ─────────────────────────────────────────────────────────

function getRounds(): NormalizedRound[] {
  try {
    const raw = localStorage.getItem(ROUNDS_KEY)
    if (!raw) return []
    const parsed: StoredRound[] = JSON.parse(raw)
    return parsed
      .map(normalizeRound)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  } catch {
    return []
  }
}

function normalizeRound(raw: StoredRound): NormalizedRound {
  const stats = raw.stats
  return {
    id: raw.id,
    date: raw.date,
    course: raw.course,
    score: stats?.score ?? raw.score ?? 0,
    par: raw.par ?? 72,
    putts: stats?.putts ?? 0,
    gir: stats?.gir ?? 0,
    fir: stats?.fir ?? 0,
    pars: stats?.pars ?? 0,
    birdies: stats?.birdies ?? 0,
    eagles: stats?.eagles ?? 0,
    bogeys: stats?.bogeys ?? 0,
    doubleBogeys: stats?.doubleBogeys ?? 0,
    triplePutts: stats?.triplePutts ?? 0,
    girMissedUnder100: stats?.girMissedUnder100 ?? 0,
    girMissed100to125: stats?.girMissed100to125 ?? 0,
    girMissed125to150: stats?.girMissed125to150 ?? 0,
    girMissed150to175: stats?.girMissed150to175 ?? 0,
    girMissedOver175: stats?.girMissedOver175 ?? 0,
    fairwayPlacements: raw.fairwayPlacements,
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function computeHandicap(rounds: NormalizedRound[]): number {
  if (rounds.length < 3) return 0
  const diffs = rounds.map((r) => r.score - r.par)
  const n = diffs.length
  const count = Math.min(n, 20)
  const recent = diffs.slice(-count)
  const numBest =
    count < 6
      ? 1
      : count < 8
        ? 2
        : count < 10
          ? 3
          : count < 12
            ? 4
            : count < 14
              ? 5
              : count < 16
                ? 6
                : count < 17
                  ? 7
                  : count < 20
                    ? 8
                    : 10
  recent.sort((a, b) => a - b)
  const best = recent.slice(0, numBest)
  const avg = best.reduce((s, v) => s + v, 0) / best.length
  return Math.round(avg * 0.96 * 10) / 10
}

function filterRounds(
  rounds: NormalizedRound[],
  range: TimeRange
): NormalizedRound[] {
  if (range === 'all') return [...rounds]
  if (range === '5') return rounds.slice(-5)
  if (range === '10') return rounds.slice(-10)
  const now = new Date()
  const days = range === '30' ? 30 : 180
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  return rounds.filter((r) => new Date(r.date) >= cutoff)
}

// ─── Animation Variants ──────────────────────────────────────────────

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const fadeUpVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
}

// ─── Custom Tooltip ───────────────────────────────────────────────────

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-white border border-border-color rounded-md shadow-card-hover px-md py-sm">
      <p className="font-body text-small text-charcoal font-semibold">
        {label}
      </p>
      {payload.map((entry, idx) => (
        <p
          key={idx}
          className="font-body text-small text-text-muted mt-xs"
        >
          <span style={{ color: entry.color }} className="font-semibold">
            {entry.name}:
          </span>{' '}
          {entry.value}
        </p>
      ))}
    </div>
  )
}

// ─── Summary Card ────────────────────────────────────────────────────

interface SummaryCardProps {
  title: string
  value: string
  delta: string
  deltaPositive: boolean
  icon: ReactNode
  iconColor: string
}

function SummaryCard({
  title,
  value,
  delta,
  deltaPositive,
  icon,
  iconColor,
}: SummaryCardProps) {
  return (
    <motion.div
      variants={fadeUpVariants}
      className="bg-gradient-to-b from-white to-[#F9F6F1] border border-border-color rounded-md p-lg shadow-card hover:shadow-card-hover hover:border-fairway transition-all duration-200 ease-smooth"
    >
      <div className="flex items-center gap-2 mb-sm">
        <span style={{ color: iconColor }}>{icon}</span>
        <span className="font-body text-small text-text-muted uppercase tracking-wide">
          {title}
        </span>
      </div>
      <div className="font-mono text-stat text-charcoal">{value}</div>
      <div className="flex items-center gap-1 mt-xs">
        {deltaPositive ? (
          <ArrowUpRight className="w-4 h-4 text-forest" />
        ) : (
          <ArrowDownRight className="w-4 h-4 text-flag-red" />
        )}
        <span
          className={`font-body text-stat-delta ${
            deltaPositive ? 'text-forest' : 'text-flag-red'
          }`}
        >
          {delta}
        </span>
      </div>
    </motion.div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      }}
      className="relative min-h-[60dvh] flex flex-col items-center justify-center text-center px-md"
    >
      <div
        className="absolute inset-0 opacity-[0.06] bg-contain bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: 'url(/handicap-trend-bg.png)' }}
      />
      <BarChart3 className="w-16 h-16 text-forest opacity-40 mb-lg" />
      <h2 className="font-display text-section-title text-forest mb-sm">
        No Rounds Yet
      </h2>
      <p className="font-body text-body text-text-muted max-w-md mb-xl">
        Start logging your rounds to unlock powerful insights and track your
        improvement over time.
      </p>
      <Link
        to="/new-round"
        className="inline-flex items-center gap-2 px-md py-sm bg-gradient-to-r from-forest to-[#3A5A30] text-white rounded-sm font-body text-small font-semibold hover:shadow-button-primary-hover active:scale-[0.98] transition-all duration-150 ease-smooth"
      >
        <Plus className="w-4 h-4" />
        Log Your First Round
      </Link>
    </motion.div>
  )
}

// ─── Chart: Handicap Trend ───────────────────────────────────────────

function HandicapChart({ rounds }: { rounds: NormalizedRound[] }) {
  const data = useMemo<ChartPoint[]>(
    () =>
      rounds.map((r) => ({
        date: formatDate(r.date),
        label: formatDateFull(r.date),
        score: r.score,
        handicap: Math.round((r.score - r.par) * 0.96 * 10) / 10,
      })),
    [rounds]
  )

  if (rounds.length < 3) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="font-body text-body italic text-text-muted text-center">
          Not enough rounds for a trend. Play 3+ rounds to see your handicap
          progression.
        </p>
      </div>
    )
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <defs>
            <linearGradient id="handicapFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.fairway} stopOpacity={0.3} />
              <stop offset="100%" stopColor={COLORS.fairway} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={COLORS.border}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: COLORS.textMuted }}
            axisLine={{ stroke: COLORS.border }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: COLORS.textMuted }}
            axisLine={false}
            tickLine={false}
            domain={['auto', 'auto']}
            reversed
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="handicap"
            stroke={COLORS.forest}
            strokeWidth={2}
            fill="url(#handicapFill)"
            dot={{
              r: 4,
              fill: COLORS.white,
              stroke: COLORS.forest,
              strokeWidth: 2,
            }}
            activeDot={{ r: 6, fill: COLORS.forest, stroke: COLORS.white, strokeWidth: 2 }}
            name="Handicap"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Chart: Scoring Distribution ──────────────────────────────────────

function ScoringDistributionChart({ rounds }: { rounds: NormalizedRound[] }) {
  const data = useMemo(() => {
    const totals = rounds.reduce(
      (acc, r) => {
        acc.pars += r.pars
        acc.birdies += r.birdies
        acc.eagles += r.eagles
        acc.bogeys += r.bogeys
        acc.doubleBogeys += r.doubleBogeys
        return acc
      },
      { pars: 0, birdies: 0, eagles: 0, bogeys: 0, doubleBogeys: 0 }
    )
    return [
      { name: 'Eagles', value: totals.eagles, color: COLORS.gold },
      { name: 'Birdies', value: totals.birdies, color: COLORS.forest },
      { name: 'Pars', value: totals.pars, color: COLORS.fairway },
      { name: 'Bogeys', value: totals.bogeys, color: COLORS.rough },
      {
        name: 'Double+',
        value: totals.doubleBogeys,
        color: COLORS.flag,
      },
    ]
  }, [rounds])

  const hasData = data.some((d) => d.value > 0)

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="font-body text-body italic text-text-muted text-center">
          Detailed hole scores not available. Log rounds with hole-by-hole data
          to see your scoring distribution.
        </p>
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={COLORS.border}
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: COLORS.textMuted }}
            axisLine={{ stroke: COLORS.border }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: COLORS.textMuted }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke={COLORS.forest} strokeWidth={1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Chart: Putting Performance ─────────────────────────────────────

function PuttingChart({ rounds }: { rounds: NormalizedRound[] }) {
  const data = useMemo<ChartPoint[]>(
    () =>
      rounds.map((r) => ({
        date: formatDate(r.date),
        label: formatDateFull(r.date),
        putts: r.putts,
        triplePutts: r.triplePutts,
      })),
    [rounds]
  )

  const avgPutts = useMemo(() => {
    if (rounds.length === 0) return 0
    return (
      rounds.reduce((s, r) => s + r.putts, 0) / rounds.length
    ).toFixed(1)
  }, [rounds])

  const hasData = rounds.some((r) => r.putts > 0)

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="font-body text-body italic text-text-muted text-center">
          Putting data not available for these rounds.
        </p>
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={COLORS.border}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: COLORS.textMuted }}
            axisLine={{ stroke: COLORS.border }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: COLORS.textMuted }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={Number(avgPutts)}
            stroke={COLORS.textMuted}
            strokeDasharray="4 4"
            label={{
              value: `Avg: ${avgPutts}`,
              position: 'right',
              fill: COLORS.textMuted,
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="triplePutts"
            name="3-Putts"
            fill={COLORS.sand}
            fillOpacity={0.6}
            radius={[2, 2, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey="putts"
            name="Putts"
            stroke={COLORS.flag}
            strokeWidth={2}
            dot={{
              r: 3,
              fill: COLORS.white,
              stroke: COLORS.flag,
              strokeWidth: 2,
            }}
            activeDot={{
              r: 5,
              fill: COLORS.flag,
              stroke: COLORS.white,
              strokeWidth: 2,
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Chart: Approach Accuracy ────────────────────────────────────────

function ApproachChart({ rounds }: { rounds: NormalizedRound[] }) {
  const girData = useMemo<ChartPoint[]>(
    () =>
      rounds.map((r) => ({
        date: formatDate(r.date),
        label: formatDateFull(r.date),
        girPct: r.par > 0 ? Math.round((r.gir / 18) * 100) : 0,
      })),
    [rounds]
  )

  const missedData = useMemo(() => {
    const totals = rounds.reduce(
      (acc, r) => {
        acc.under100 += r.girMissedUnder100
        acc['100to125'] += r.girMissed100to125
        acc['125to150'] += r.girMissed125to150
        acc['150to175'] += r.girMissed150to175
        acc.over175 += r.girMissedOver175
        return acc
      },
      {
        under100: 0,
        '100to125': 0,
        '125to150': 0,
        '150to175': 0,
        over175: 0,
      }
    )
    return [
      { name: '< 100', value: totals.under100 },
      { name: '100–125', value: totals['100to125'] },
      { name: '125–150', value: totals['125to150'] },
      { name: '150–175', value: totals['150to175'] },
      { name: '175+', value: totals.over175 },
    ]
  }, [rounds])

  const hasGir = rounds.some((r) => r.gir > 0)
  const hasMissed = missedData.some((d) => d.value > 0)

  return (
    <div className="space-y-md">
      {/* GIR % over time */}
      {hasGir && (
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={girData}
              margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
            >
              <defs>
                <linearGradient
                  id="girFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={COLORS.fairway}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor={COLORS.fairway}
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={COLORS.border}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: COLORS.textMuted }}
                axisLine={{ stroke: COLORS.border }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: COLORS.textMuted }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                unit="%"
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="girPct"
                name="GIR %"
                stroke={COLORS.forest}
                strokeWidth={2}
                fill="url(#girFill)"
                dot={{
                  r: 3,
                  fill: COLORS.white,
                  stroke: COLORS.forest,
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Missed GIR by distance */}
      {hasMissed ? (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={missedData}
              margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={COLORS.border}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: COLORS.textMuted }}
                axisLine={{ stroke: COLORS.border }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: COLORS.textMuted }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Missed GIR" fill={COLORS.flag} fillOpacity={0.7} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center h-32">
          <p className="font-body text-small italic text-text-muted text-center">
            Approach distance data not available.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Chart: Fairway Hit Rate ─────────────────────────────────────────

function FairwayChart({ rounds }: { rounds: NormalizedRound[] }) {
  const data = useMemo<ChartPoint[]>(
    () =>
      rounds.map((r) => ({
        date: formatDate(r.date),
        label: formatDateFull(r.date),
        firPct: Math.round((r.fir / 18) * 100),
      })),
    [rounds]
  )

  const missData = useMemo(() => {
    let left = 0
    let right = 0
    let total = 0
    rounds.forEach((r) => {
      if (r.fairwayPlacements) {
        Object.values(r.fairwayPlacements).forEach((p) => {
          total++
          if (p.x < 0.4) left++
          else if (p.x > 0.6) right++
        })
      }
    })
    return { left, right, total, hasData: total > 0 }
  }, [rounds])

  const hasFir = rounds.some((r) => r.fir > 0)

  return (
    <div className="space-y-md">
      {hasFir && (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
            >
              <defs>
                <linearGradient
                  id="firFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={COLORS.greenLight}
                    stopOpacity={0.5}
                  />
                  <stop
                    offset="100%"
                    stopColor={COLORS.greenLight}
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={COLORS.border}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: COLORS.textMuted }}
                axisLine={{ stroke: COLORS.border }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: COLORS.textMuted }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                unit="%"
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={60}
                stroke={COLORS.gold}
                strokeDasharray="4 4"
                label={{
                  value: 'Tour Avg: 60%',
                  position: 'right',
                  fill: COLORS.gold,
                  fontSize: 11,
                }}
              />
              <Area
                type="monotone"
                dataKey="firPct"
                name="FIR %"
                stroke={COLORS.forest}
                strokeWidth={2}
                fill="url(#firFill)"
                dot={{
                  r: 3,
                  fill: COLORS.white,
                  stroke: COLORS.forest,
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {missData.hasData && (
        <div className="grid grid-cols-2 gap-md">
          <div className="bg-green-light border border-fairway rounded-md p-md text-center">
            <div className="font-mono text-xl font-bold text-forest">
              {Math.round((missData.left / missData.total) * 100)}%
            </div>
            <div className="font-body text-small text-text-muted mt-xs">
              Left Miss
            </div>
          </div>
          <div className="bg-[#F5E0DC] border border-flag-red/30 rounded-md p-md text-center">
            <div className="font-mono text-xl font-bold text-flag-red">
              {Math.round((missData.right / missData.total) * 100)}%
            </div>
            <div className="font-body text-small text-text-muted mt-xs">
              Right Miss
            </div>
          </div>
        </div>
      )}

      {!hasFir && !missData.hasData && (
        <div className="flex items-center justify-center h-32">
          <p className="font-body text-body italic text-text-muted text-center">
            Fairway data not available for these rounds.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Recent Rounds Table ──────────────────────────────────────────────

function RecentRoundsTable({ rounds }: { rounds: NormalizedRound[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const recent = useMemo(
    () => [...rounds].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10),
    [rounds]
  )

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="border-b border-border-color">
            <th className="text-left font-body text-small text-text-muted font-medium py-sm px-md">
              Date
            </th>
            <th className="text-left font-body text-small text-text-muted font-medium py-sm px-md">
              Course
            </th>
            <th className="text-right font-body text-small text-text-muted font-medium py-sm px-md">
              Score
            </th>
            <th className="text-right font-body text-small text-text-muted font-medium py-sm px-md">
              Putts
            </th>
            <th className="text-right font-body text-small text-text-muted font-medium py-sm px-md">
              GIR
            </th>
            <th className="text-right font-body text-small text-text-muted font-medium py-sm px-md">
              FIR
            </th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {recent.map((round) => {
            const isExpanded = expandedId === round.id
            return (
              <>
                <tr
                  key={round.id}
                  onClick={() => toggleExpand(round.id)}
                  className="border-b border-border-light hover:bg-sand/40 cursor-pointer transition-colors duration-150 ease-smooth"
                >
                  <td className="py-sm px-md font-body text-body text-charcoal">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-text-muted" />
                      {formatDateFull(round.date)}
                    </div>
                  </td>
                  <td className="py-sm px-md font-body text-body text-charcoal">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-text-muted" />
                      {round.course}
                    </div>
                  </td>
                  <td className="py-sm px-md text-right font-mono text-body text-charcoal font-semibold">
                    {round.score}
                  </td>
                  <td className="py-sm px-md text-right font-mono text-body text-charcoal">
                    {round.putts > 0 ? round.putts : '-'}
                  </td>
                  <td className="py-sm px-md text-right font-mono text-body text-charcoal">
                    {round.gir > 0 ? `${Math.round((round.gir / 18) * 100)}%` : '-'}
                  </td>
                  <td className="py-sm px-md text-right font-mono text-body text-charcoal">
                    {round.fir > 0 ? `${Math.round((round.fir / 18) * 100)}%` : '-'}
                  </td>
                  <td className="py-sm px-md">
                    <ChevronRight
                      className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </td>
                </tr>
                {isExpanded && (
                  <tr key={`${round.id}-detail`}>
                    <td colSpan={7} className="px-md py-sm">
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-sand/30 rounded-md p-md"
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">
                          <div>
                            <p className="font-body text-small text-text-muted">Pars</p>
                            <p className="font-mono text-body text-charcoal font-semibold">{round.pars || '-'}</p>
                          </div>
                          <div>
                            <p className="font-body text-small text-text-muted">Birdies</p>
                            <p className="font-mono text-body text-charcoal font-semibold">{round.birdies || '-'}</p>
                          </div>
                          <div>
                            <p className="font-body text-small text-text-muted">Bogeys</p>
                            <p className="font-mono text-body text-charcoal font-semibold">{round.bogeys || '-'}</p>
                          </div>
                          <div>
                            <p className="font-body text-small text-text-muted">3-Putts</p>
                            <p className="font-mono text-body text-charcoal font-semibold">{round.triplePutts || '-'}</p>
                          </div>
                        </div>
                      </motion.div>
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Section Card Wrapper ─────────────────────────────────────────────

interface SectionCardProps {
  title: string
  subtitle: string
  children: ReactNode
}

function SectionCard({ title, subtitle, children }: SectionCardProps) {
  return (
    <motion.div
      variants={fadeUpVariants}
      className="bg-gradient-to-b from-white to-[#F9F6F1] border border-border-color rounded-md p-lg shadow-card hover:shadow-card-hover transition-shadow duration-200 ease-smooth"
    >
      <div className="mb-md">
        <h3 className="font-display text-section-title text-forest">{title}</h3>
        <p className="font-body text-small text-text-muted mt-xs">{subtitle}</p>
      </div>
      {children}
    </motion.div>
  )
}

// ─── Main Analytics Page ─────────────────────────────────────────────

export default function Analytics() {
  const [rounds, setRounds] = useState<NormalizedRound[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange>('all')

  useEffect(() => {
    setRounds(getRounds())
  }, [])

  const filtered = useMemo(
    () => filterRounds(rounds, timeRange),
    [rounds, timeRange]
  )

  const stats = useMemo(() => {
    if (filtered.length === 0) {
      return {
        totalRounds: 0,
        avgScore: 0,
        bestScore: 0,
        handicap: 0,
        handicapPrev: 0,
        avgPutts: 0,
        avgGir: 0,
        avgFir: 0,
      }
    }

    const scores = filtered.map((r) => r.score)
    const totalRounds = filtered.length
    const avgScore = scores.reduce((s, v) => s + v, 0) / totalRounds
    const bestScore = Math.min(...scores)

    const handicap = computeHandicap(filtered)
    const prevRounds = rounds.slice(0, rounds.length - filtered.length + Math.max(0, filtered.length - 1))
    const handicapPrev = prevRounds.length >= 3 ? computeHandicap(prevRounds) : handicap

    const putts = filtered.filter((r) => r.putts > 0)
    const avgPutts = putts.length > 0 ? putts.reduce((s, r) => s + r.putts, 0) / putts.length : 0

    const gir = filtered.filter((r) => r.gir > 0)
    const avgGir = gir.length > 0 ? gir.reduce((s, r) => s + r.gir, 0) / gir.length : 0

    const fir = filtered.filter((r) => r.fir > 0)
    const avgFir = fir.length > 0 ? fir.reduce((s, r) => s + r.fir, 0) / fir.length : 0

    return {
      totalRounds,
      avgScore,
      bestScore,
      handicap,
      handicapPrev,
      avgPutts,
      avgGir,
      avgFir,
    }
  }, [filtered, rounds])

  if (rounds.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-parchment">
        <div className="max-w-[1200px] mx-auto px-md pt-3xl pb-2xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
            }}
            className="mb-xl"
          >
            <h1 className="font-display text-page-title text-forest">Analytics</h1>
            <p className="font-body text-body text-text-muted mt-sm">
              See your game improve.
            </p>
          </motion.div>
          <EmptyState />
        </div>
      </div>
    )
  }

  const handicapDelta = stats.handicap - stats.handicapPrev
  const handicapDeltaStr =
    handicapDelta === 0
      ? 'No change'
      : `${handicapDelta > 0 ? '+' : ''}${handicapDelta.toFixed(1)} vs previous`
  const handicapDeltaPositive = handicapDelta <= 0

  return (
    <div className="min-h-[100dvh] bg-parchment">
      <motion.div
        className="max-w-[1200px] mx-auto px-md pt-3xl pb-2xl"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Page Header */}
        <motion.div
          variants={fadeUpVariants}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-xl"
        >
          <div>
            <h1 className="font-display text-page-title text-forest">
              Analytics
            </h1>
            <p className="font-body text-body text-text-muted mt-sm">
              See your game improve.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 px-md py-sm border-[1.5px] border-border-color text-charcoal rounded-sm font-body text-small font-semibold hover:bg-sand hover:border-fairway transition-all duration-150 ease-smooth self-start sm:self-auto">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </motion.div>

        {/* Time Range Selector */}
        <motion.div
          variants={fadeUpVariants}
          className="flex flex-wrap items-center gap-xs mb-xl"
        >
          {TIME_RANGES.map((range) => {
            const isActive = timeRange === range.key
            return (
              <button
                key={range.key}
                onClick={() => setTimeRange(range.key)}
                className={`px-4 py-2 rounded-full font-body text-small font-medium transition-all duration-150 ease-smooth ${
                  isActive
                    ? 'bg-forest text-white'
                    : 'bg-transparent text-forest hover:bg-green-light'
                }`}
              >
                {range.label}
              </button>
            )
          })}
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          variants={fadeUpVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg mb-2xl"
        >
          <SummaryCard
            title="Best Score"
            value={stats.bestScore > 0 ? String(stats.bestScore) : '-'}
            delta={`${(stats.avgScore - stats.bestScore).toFixed(1)} vs avg`}
            deltaPositive={true}
            icon={<Trophy className="w-5 h-5" />}
            iconColor={COLORS.gold}
          />
          <SummaryCard
            title="Scoring Avg"
            value={stats.avgScore > 0 ? stats.avgScore.toFixed(1) : '-'}
            delta={
              filtered.length > 1
                ? `${(stats.avgScore - filterRounds(rounds, '10').slice(0, Math.max(1, filtered.length - 1)).reduce((s, r) => s + r.score, 0) / Math.max(1, filterRounds(rounds, '10').slice(0, Math.max(1, filtered.length - 1)).length)).toFixed(1)} trend`
                : 'No trend'
            }
            deltaPositive={true}
            icon={<TrendingDown className="w-5 h-5" />}
            iconColor={COLORS.forest}
          />
          <SummaryCard
            title="GIR Avg"
            value={stats.avgGir > 0 ? stats.avgGir.toFixed(1) : '-'}
            delta={`${stats.avgGir > 0 ? 'per round' : 'No data'}`}
            deltaPositive={stats.avgGir > 0}
            icon={<Flag className="w-5 h-5" />}
            iconColor={COLORS.forest}
          />
          <SummaryCard
            title="Putts / Round"
            value={stats.avgPutts > 0 ? stats.avgPutts.toFixed(1) : '-'}
            delta={`${stats.avgPutts > 0 ? 'per round' : 'No data'}`}
            deltaPositive={stats.avgPutts > 0 && stats.avgPutts < 32}
            icon={<Target className="w-5 h-5" />}
            iconColor={COLORS.sky}
          />
        </motion.div>

        {/* Handicap Trend */}
        <div className="mb-2xl">
          <SectionCard
            title="Handicap Trend"
            subtitle="Your index over time"
          >
            <HandicapChart rounds={filtered} />
          </SectionCard>
        </div>

        {/* Charts Grid: Scoring + Putting */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg mb-2xl">
          <SectionCard
            title="Score Distribution"
            subtitle="How often you score each result"
          >
            <ScoringDistributionChart rounds={filtered} />
          </SectionCard>

          <SectionCard
            title="Putting Performance"
            subtitle="Putts per round and 3-putt frequency"
          >
            <PuttingChart rounds={filtered} />
          </SectionCard>
        </div>

        {/* Charts Grid: Approach + Fairway */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg mb-2xl">
          <SectionCard
            title="Approach Accuracy"
            subtitle="GIR by approach distance"
          >
            <ApproachChart rounds={filtered} />
          </SectionCard>

          <SectionCard
            title="Driving Accuracy"
            subtitle="Fairway hit rate over time"
          >
            <FairwayChart rounds={filtered} />
          </SectionCard>
        </div>

        {/* Recent Rounds Table */}
        <motion.div variants={fadeUpVariants}>
          <SectionCard
            title="Recent Rounds"
            subtitle="Your last 10 rounds at a glance"
          >
            <RecentRoundsTable rounds={filtered} />
          </SectionCard>
        </motion.div>
      </motion.div>
    </div>
  )
}
