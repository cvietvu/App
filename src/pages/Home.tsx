import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MapPin,
  TrendingUp,
  Calendar,
  Target,
  Flag,
  ChevronRight,
  History,
  BarChart3,
  Download,
  Lightbulb,
  Plus,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────

interface Round {
  id: string
  date: string
  course: string
  score: number
  par: number
}

interface DashboardStats {
  handicap: number
  handicapDelta: number
  roundsThisMonth: number
  roundsLastMonth: number
  averageScore: number
  averageScoreLast5: number
  girRate: number
  girRateLastMonth: number
}

// ─── Local Storage Helpers ─────────────────────────────────────────

const ROUNDS_KEY = 'golfer-blueprint-rounds'

function getRounds(): Round[] {
  try {
    const raw = localStorage.getItem(ROUNDS_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function getStats(): DashboardStats {
  const rounds = getRounds()
  // If no real data, return demo data as specified in design.md
  if (rounds.length === 0) {
    return {
      handicap: 14.2,
      handicapDelta: -0.3,
      roundsThisMonth: 8,
      roundsLastMonth: 6,
      averageScore: 87,
      averageScoreLast5: 89,
      girRate: 42,
      girRateLastMonth: 37,
    }
  }
  // Real calculation would go here
  return {
    handicap: 14.2,
    handicapDelta: -0.3,
    roundsThisMonth: 8,
    roundsLastMonth: 6,
    averageScore: 87,
    averageScoreLast5: 89,
    girRate: 42,
    girRateLastMonth: 37,
  }
}

// ─── Animation Variants ────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
}

const fadeUpVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
}

const listItemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  },
}

// ─── Sparkline Component ───────────────────────────────────────────

function HandicapSparkline() {
  const data = [15.1, 14.8, 14.6, 14.5, 14.2]
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const width = 80
  const height = 30
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  })
  const pathD = `M${points.join(' L')}`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="mt-2">
      <motion.path
        d={pathD}
        fill="none"
        stroke="#4A6B3E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.3 }}
      />
    </svg>
  )
}

// ─── Stat Card Component ───────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  delta?: { text: string; positive: boolean }
  accent?: 'gold' | 'fairway' | 'flag' | 'none'
  extra?: React.ReactNode
  onClick?: () => void
}

function StatCard({ icon, label, value, delta, accent = 'none', extra, onClick }: StatCardProps) {
  const borderClass = accent === 'gold' ? 'border-l-[4px] border-l-gold' : ''

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
      className={`bg-white border border-border-color rounded-md p-lg shadow-card cursor-default transition-colors duration-200 ease-smooth ${borderClass} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="font-body text-small text-text-muted">{label}</span>
      </div>
      <div className="font-mono text-stat text-forest">{value}</div>
      {delta && (
        <div className="flex items-center gap-1 mt-1">
          <span
            className={`font-body text-stat-delta px-2 py-0.5 rounded-full border ${
              delta.positive
                ? 'bg-green-light text-forest border-fairway'
                : 'bg-[#F5E0DC] text-flag-red border-flag-red/30'
            }`}
          >
            {delta.text}
          </span>
        </div>
      )}
      {extra}
    </motion.div>
  )
}

// ─── Progress Bar Component ────────────────────────────────────────

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-full h-1 bg-border-color rounded-full mt-3 overflow-hidden">
      <motion.div
        className="h-full bg-fairway rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.4 }}
      />
    </div>
  )
}

// ─── Main Home Component ───────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate()
  const [rounds, setRounds] = useState<Round[]>([])
  const stats = useMemo(() => getStats(), [rounds])

  useEffect(() => {
    setRounds(getRounds())
  }, [])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning, golfer.'
    if (hour < 17) return 'Good afternoon, golfer.'
    return 'Good evening, golfer.'
  }, [])

  const tips = [
    'Focus on your tempo, not your speed. A smooth swing often travels farther than a fast one.',
    'Before every shot, pick a specific target the size of a golf ball.',
    'Aim to land your approach shots below the hole for an easier putt.',
    'Spend 70% of your practice time on shots within 100 yards.',
  ]
  const [tipIndex] = useState(0)

  const handleExport = () => {
    const allRounds = getRounds()
    const blob = new Blob([JSON.stringify(allRounds, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `golfer-blueprint-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getScoreStyle = (score: number, par: number) => {
    return score <= par + 5
      ? 'bg-green-light text-forest border border-fairway'
      : 'bg-[#F5E0DC] text-flag-red border border-flag-red/30'
  }

  return (
    <div className="max-w-[1200px] mx-auto px-md py-3xl pb-2xl">
      {/* ── Section 1: Welcome Header ── */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-3xl"
      >
        <div>
          <motion.h1
            variants={fadeUpVariants}
            className="font-display text-page-title text-forest"
          >
            {greeting}
          </motion.h1>
          <motion.p
            variants={fadeUpVariants}
            className="font-body text-body text-text-muted mt-sm"
          >
            Ready to log your next round?
          </motion.p>
        </div>
        <motion.div variants={fadeUpVariants}>
          <Link
            to="/new-round"
            className="inline-flex items-center gap-2 px-md py-sm bg-gradient-to-r from-forest to-[#3A5A30] text-white font-body text-small font-semibold rounded-sm shadow-button-primary-hover hover:brightness-110 active:scale-[0.98] transition-all duration-150 ease-smooth"
          >
            <Plus className="w-4 h-4" />
            New Round
          </Link>
        </motion.div>
      </motion.div>

      {/* ── Section 2: Handicap & Stats Overview ── */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg mb-3xl"
      >
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-gold" />}
          label="Handicap Index"
          value={stats.handicap.toFixed(1)}
          delta={{ text: `${stats.handicapDelta > 0 ? '+' : ''}${stats.handicapDelta} from last round`, positive: stats.handicapDelta < 0 }}
          accent="gold"
          extra={<HandicapSparkline />}
          onClick={() => navigate('/analytics')}
        />
        <StatCard
          icon={<Calendar className="w-5 h-5 text-fairway" />}
          label="Rounds This Month"
          value={String(stats.roundsThisMonth)}
          delta={{ text: `${stats.roundsThisMonth - stats.roundsLastMonth} more than last month`, positive: true }}
        />
        <StatCard
          icon={<Target className="w-5 h-5 text-flag-red" />}
          label="Average Score"
          value={String(stats.averageScore)}
          delta={{ text: `${stats.averageScore - stats.averageScoreLast5 > 0 ? '+' : ''}${stats.averageScore - stats.averageScoreLast5} vs. last 5`, positive: stats.averageScore < stats.averageScoreLast5 }}
        />
        <StatCard
          icon={<Flag className="w-5 h-5 text-fairway" />}
          label="GIR Rate"
          value={`${stats.girRate}%`}
          delta={{ text: `+${stats.girRate - stats.girRateLastMonth}% vs. last month`, positive: true }}
          extra={<ProgressBar percent={stats.girRate} />}
        />
      </motion.div>

      {/* ── Section 3: Recent Rounds ── */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="mb-3xl"
      >
        <div className="flex items-center justify-between mb-lg">
          <motion.h2 variants={fadeUpVariants} className="font-display text-section-title text-forest">
            Recent Rounds
          </motion.h2>
          <motion.div variants={fadeUpVariants}>
            <Link
              to="/history"
              className="inline-flex items-center gap-1 font-body text-small text-forest hover:underline transition-all duration-150 ease-smooth"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>

        <motion.div
          variants={fadeUpVariants}
          className="bg-white border border-border-color rounded-md shadow-card overflow-hidden"
        >
          {rounds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-2xl px-md">
              <img
                src="/empty-state-history.png"
                alt="Empty scorebook"
                className="w-64 h-auto mb-lg opacity-80"
              />
              <p className="font-body text-body italic text-text-muted text-center">
                No rounds yet. Start your first round above.
              </p>
            </div>
          ) : (
            <div className="max-h-[360px] overflow-y-auto">
              {rounds.slice(0, 5).map((round, i) => (
                <motion.div
                  key={round.id}
                  variants={listItemVariants}
                  custom={i}
                  whileHover={{ backgroundColor: 'rgba(232, 221, 208, 0.5)' }}
                  className="flex items-center justify-between px-lg py-3 border-b border-border-light last:border-b-0 cursor-pointer transition-colors duration-150 ease-smooth"
                  onClick={() => navigate('/new-round', { state: { round } })}
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-body text-small text-text-muted block sm:hidden">
                      {formatDate(round.date)}
                    </span>
                    <span className="font-body text-small text-text-muted hidden sm:block w-28 shrink-0">
                      {formatDate(round.date)}
                    </span>
                  </div>
                  <span className="font-body text-body text-charcoal font-medium truncate flex-1 text-center sm:text-left">
                    {round.course}
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`font-body text-small font-bold px-3 py-1 rounded-full ${getScoreStyle(round.score, round.par)}`}>
                      {round.score}
                    </span>
                    <ChevronRight className="w-4 h-4 text-text-muted" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* ── Section 4: Quick Actions ── */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="flex flex-wrap gap-md mb-3xl"
      >
        <motion.div variants={fadeUpVariants}>
          <Link
            to="/new-round"
            className="inline-flex items-center gap-2 px-md py-sm bg-gradient-to-r from-forest to-[#3A5A30] text-white font-body text-small font-semibold rounded-sm shadow-button-primary-hover hover:brightness-110 active:scale-[0.98] transition-all duration-150 ease-smooth"
          >
            <MapPin className="w-4 h-4" />
            Log New Round
          </Link>
        </motion.div>
        <motion.div variants={fadeUpVariants}>
          <Link
            to="/history"
            className="inline-flex items-center gap-2 px-md py-sm bg-transparent border-[1.5px] border-border-color text-charcoal font-body text-small font-semibold rounded-sm hover:bg-sand hover:border-fairway active:scale-[0.98] transition-all duration-150 ease-smooth"
          >
            <History className="w-4 h-4" />
            View History
          </Link>
        </motion.div>
        <motion.div variants={fadeUpVariants}>
          <Link
            to="/analytics"
            className="inline-flex items-center gap-2 px-md py-sm bg-transparent border-[1.5px] border-border-color text-charcoal font-body text-small font-semibold rounded-sm hover:bg-sand hover:border-fairway active:scale-[0.98] transition-all duration-150 ease-smooth"
          >
            <BarChart3 className="w-4 h-4" />
            View Analytics
          </Link>
        </motion.div>
        <motion.div variants={fadeUpVariants}>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-md py-sm bg-transparent text-forest font-body text-small font-semibold rounded-sm hover:bg-green-light active:scale-[0.98] transition-all duration-150 ease-smooth"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </motion.div>
      </motion.div>

      {/* ── Section 5: Today's Tip ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.5 }}
        className="bg-white border border-border-color rounded-md p-lg shadow-card border-l-[4px] border-l-fairway"
      >
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-5 h-5 text-gold" />
          <span className="font-body text-small text-text-muted">Tip of the Day</span>
        </div>
        <p className="font-body text-body italic text-charcoal">
          {tips[tipIndex]}
        </p>
      </motion.div>
    </div>
  )
}
