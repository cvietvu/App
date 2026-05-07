import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO, isAfter, subDays, subMonths, startOfYear } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Download,
  ExternalLink,
  Trash2,
  Calendar,
  MapPin,
  Flag,
  TrendingUp,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface Round {
  id: string
  date: string
  course: string
  teeTime?: string
  stockShotShape?: string
  goals?: string
  fairwayPlacements: Record<number, { x: number; y: number }>
  approachPlacements: Record<number, { x: number; y: number; distance: number }>
  stats: {
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
  notes: string
}

const ROUNDS_KEY = 'golfer-blueprint-rounds'
const ACTIVE_ROUND_KEY = 'golfer-blueprint-active-round'

function getRounds(): Round[] {
  try {
    const raw = localStorage.getItem(ROUNDS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Round[]
  } catch {
    return []
  }
}

function saveRounds(rounds: Round[]) {
  localStorage.setItem(ROUNDS_KEY, JSON.stringify(rounds))
}

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy')
  } catch {
    return dateStr
  }
}

function formatTime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'h:mm a')
  } catch {
    return ''
  }
}

function getHolesTracked(round: Round): number {
  const fairwayKeys = Object.keys(round.fairwayPlacements || {}).length
  const approachKeys = Object.keys(round.approachPlacements || {}).length
  return Math.max(fairwayKeys, approachKeys, 0)
}

function getScoreVsPar(round: Round): string {
  const par = 72
  const diff = round.stats.score - par
  if (diff === 0) return 'E'
  if (diff > 0) return `+${diff}`
  return `${diff}`
}

const dateFilterOptions = [
  { value: 'all', label: 'All Time' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '6m', label: 'Last 6 Months' },
  { value: 'year', label: 'This Year' },
] as const

const sortOptions = [
  { value: 'date-desc', label: 'Date (Newest)' },
  { value: 'date-asc', label: 'Date (Oldest)' },
  { value: 'score-asc', label: 'Score (Low)' },
  { value: 'score-desc', label: 'Score (High)' },
  { value: 'course-asc', label: 'Course (A–Z)' },
] as const

const scoreFilterOptions = [
  { value: 'all', label: 'All Scores' },
  { value: 'under80', label: 'Under 80' },
  { value: '80-89', label: '80–89' },
  { value: '90-99', label: '90–99' },
  { value: '100plus', label: '100+' },
] as const

export default function History() {
  const navigate = useNavigate()
  const [rounds, setRounds] = useState<Round[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date-desc')
  const [scoreFilter, setScoreFilter] = useState<string>('all')
  const [deleteRound, setDeleteRound] = useState<Round | null>(null)
  const [visibleCount, setVisibleCount] = useState(10)

  useEffect(() => {
    setRounds(getRounds())
  }, [])

  const filteredRounds = useMemo(() => {
    let result = [...rounds]

    // Search by course name
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((r) => r.course.toLowerCase().includes(q))
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      result = result.filter((r) => {
        const d = parseISO(r.date)
        switch (dateFilter) {
          case '30d':
            return isAfter(d, subDays(now, 30))
          case '6m':
            return isAfter(d, subMonths(now, 6))
          case 'year':
            return isAfter(d, startOfYear(now))
          default:
            return true
        }
      })
    }

    // Score filter
    if (scoreFilter !== 'all') {
      result = result.filter((r) => {
        const s = r.stats.score
        switch (scoreFilter) {
          case 'under80':
            return s < 80
          case '80-89':
            return s >= 80 && s <= 89
          case '90-99':
            return s >= 90 && s <= 99
          case '100plus':
            return s >= 100
          default:
            return true
        }
      })
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case 'score-asc':
          return a.stats.score - b.stats.score
        case 'score-desc':
          return b.stats.score - a.stats.score
        case 'course-asc':
          return a.course.localeCompare(b.course)
        default:
          return 0
      }
    })

    return result
  }, [rounds, searchQuery, dateFilter, sortBy, scoreFilter])

  const visibleRounds = useMemo(() => {
    return filteredRounds.slice(0, visibleCount)
  }, [filteredRounds, visibleCount])

  const hasMore = filteredRounds.length > visibleCount

  const handleOpenRound = useCallback(
    (round: Round) => {
      localStorage.setItem(ACTIVE_ROUND_KEY, JSON.stringify(round))
      navigate('/new-round')
    },
    [navigate]
  )

  const handleDelete = useCallback(() => {
    if (!deleteRound) return
    const next = rounds.filter((r) => r.id !== deleteRound.id)
    setRounds(next)
    saveRounds(next)
    setDeleteRound(null)
  }, [deleteRound, rounds])

  const handleExportAll = useCallback(() => {
    const data = JSON.stringify(rounds, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `golfer-blueprint-export-${format(new Date(), 'yyyy-MM-dd')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [rounds])

  const roundCount = rounds.length

  return (
    <div className="max-w-[1000px] mx-auto px-md py-3xl pb-2xl">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="font-display text-page-title text-forest">Round History</h1>
          <p className="font-body text-body text-text-muted mt-sm">Your complete golfing record.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-full bg-green-light border border-fairway">
            <span className="font-body text-small text-forest font-semibold">
              {roundCount} {roundCount === 1 ? 'round' : 'rounds'}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAll}
            disabled={roundCount === 0}
            className="border-border-color text-charcoal hover:bg-sand hover:border-fairway"
          >
            <Download className="w-4 h-4" />
            Export All
          </Button>
        </div>
      </motion.div>

      {/* Filter & Sort Bar */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number], delay: 0.1 }}
        className="flex flex-wrap items-center gap-md mb-8 pb-4 border-b border-border-color"
      >
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full sm:w-[240px] h-9 bg-white border-border-color focus-visible:border-forest focus-visible:ring-forest/10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-text-muted" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-border-color bg-white font-body text-small text-charcoal focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest/10 cursor-pointer"
          >
            {dateFilterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-text-muted" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 px-3 rounded-md border border-border-color bg-white font-body text-small text-charcoal focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest/10 cursor-pointer"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-text-muted" />
          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-border-color bg-white font-body text-small text-charcoal focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest/10 cursor-pointer"
          >
            {scoreFilterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Round List */}
      <div className="flex flex-col gap-md">
        <AnimatePresence mode="wait">
          {visibleRounds.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <img
                src="/empty-state-history.png"
                alt="No rounds found"
                className="w-[200px] h-[150px] object-contain mb-6 opacity-80"
              />
              <h2 className="font-display text-section-title text-charcoal mb-2">No rounds found</h2>
              <p className="font-body text-body text-text-muted mb-6">
                {searchQuery || dateFilter !== 'all' || scoreFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'Start tracking your first round to see it here.'}
              </p>
              {!searchQuery && dateFilter === 'all' && scoreFilter === 'all' && (
                <Button
                  onClick={() => navigate('/new-round')}
                  className="bg-gradient-to-br from-forest to-[#3A5A30] text-white hover:shadow-button-primary-hover active:scale-[0.98] transition-all duration-150 ease-smooth"
                >
                  <MapPin className="w-4 h-4" />
                  Log Your First Round
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-md"
            >
              {visibleRounds.map((round, index) => {
                const holesTracked = getHolesTracked(round)
                const scoreVsPar = getScoreVsPar(round)
                return (
                  <motion.div
                    key={round.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{
                      duration: 0.3,
                      ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
                      delay: index * 0.06,
                    }}
                    onClick={() => handleOpenRound(round)}
                    className={`
                      group relative cursor-pointer rounded-md border border-border-color bg-gradient-to-b from-white to-[#F9F6F1]
                      shadow-card hover:shadow-card-hover hover:border-fairway hover:-translate-y-0.5
                      transition-all duration-200 ease-smooth p-lg
                      ${index % 2 === 1 ? 'bg-[rgba(232,221,208,0.3)]' : ''}
                    `}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Left: Date */}
                      <div className="sm:w-[20%] flex-shrink-0">
                        <p className="font-body text-body text-charcoal font-medium">
                          {formatDate(round.date)}
                        </p>
                        <p className="font-body text-small text-text-muted mt-0.5">
                          {formatTime(round.date)} · {holesTracked} {holesTracked === 1 ? 'hole' : 'holes'}
                        </p>
                      </div>

                      {/* Center: Course & Tags */}
                      <div className="sm:w-[45%] flex-1">
                        <h3 className="font-body text-card-title text-forest font-semibold mb-2">
                          {round.course}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-green-light border border-fairway font-body text-small text-forest">
                            {round.stats.gir} GIR
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-green-light border border-fairway font-body text-small text-forest">
                            {round.stats.fir} FIR
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-sand font-body text-small text-charcoal">
                            {round.stats.putts} Putts
                          </span>
                        </div>
                      </div>

                      {/* Right: Score */}
                      <div className="sm:w-[18%] flex-shrink-0 text-left sm:text-right">
                        <p className="font-mono text-stat text-forest leading-none">
                          {round.stats.score || '-'}
                        </p>
                        <p className="font-body text-stat-delta text-text-muted mt-1">
                          {scoreVsPar}
                        </p>
                      </div>

                      {/* Far Right: Actions */}
                      <div className="sm:w-[17%] flex-shrink-0 flex items-center gap-2 sm:justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenRound(round)
                          }}
                          className="text-forest hover:bg-green-light h-8 px-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span className="font-body text-small">Open</span>
                        </Button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteRound(round)
                          }}
                          className="flex items-center justify-center w-8 h-8 rounded-md text-text-muted hover:text-flag-red hover:bg-[#F5E0DC] transition-colors duration-150 ease-smooth"
                          aria-label="Delete round"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibleCount((c) => c + 10)}
              className="border-border-color text-charcoal hover:bg-sand hover:border-fairway"
            >
              Load More
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteRound} onOpenChange={(open) => !open && setDeleteRound(null)}>
        <DialogContent className="bg-white border-border-color rounded-lg max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-section-title text-charcoal">
              Delete this round?
            </DialogTitle>
            <DialogDescription className="font-body text-body text-text-muted">
              Round at {deleteRound?.course} on {deleteRound ? formatDate(deleteRound.date) : ''} will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteRound(null)}
              className="border-border-color text-charcoal hover:bg-sand hover:border-fairway"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-flag-red text-white hover:bg-flag-red/90"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
