import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Sliders,
  Database,
  Info,
  Download,
  Upload,
  Trash2,
  Mail,
  Check,
  AlertTriangle,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface AppSettings {
  playerName: string
  homeCourse: string
  handicapGoal: string
  preferredUnits: 'yards' | 'meters'
  defaultPar: number
  autoCalculateTotals: boolean
  showDistanceLabels: boolean
  confirmBeforeClear: boolean
}

const SETTINGS_KEY = 'golfer-blueprint-settings'
const ROUNDS_KEY = 'golfer-blueprint-rounds'

const defaultSettings: AppSettings = {
  playerName: '',
  homeCourse: '',
  handicapGoal: '',
  preferredUnits: 'yards',
  defaultPar: 72,
  autoCalculateTotals: true,
  showDistanceLabels: true,
  confirmBeforeClear: true,
}

function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...defaultSettings }
    return { ...defaultSettings, ...JSON.parse(raw) }
  } catch {
    return { ...defaultSettings }
  }
}

function saveSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

function getRounds(): unknown[] {
  try {
    const raw = localStorage.getItem(ROUNDS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as unknown[]
  } catch {
    return []
  }
}

function saveRounds(rounds: unknown[]) {
  localStorage.setItem(ROUNDS_KEY, JSON.stringify(rounds))
}

function isValidRoundArray(data: unknown): data is unknown[] {
  return Array.isArray(data) && data.every((r) => r && typeof r === 'object' && 'id' in (r as object))
}

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      delay: i * 0.08,
    },
  }),
}

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(getSettings)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Persist settings on change
  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleExport = useCallback(() => {
    const rounds = getRounds()
    const exportData = {
      app: "A Golfer's Blueprint",
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      settings,
      rounds,
    }
    const data = JSON.stringify(exportData, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `golfer-blueprint-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [settings])

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const parsed = JSON.parse(text)

        if (parsed.rounds && isValidRoundArray(parsed.rounds)) {
          const existing = getRounds()
          const merged = [...existing, ...parsed.rounds]
          // Deduplicate by id
          const byId = new Map<string, unknown>()
          merged.forEach((r) => {
            const id = (r as Record<string, unknown>).id as string
            if (id) byId.set(id, r)
          })
          const deduped = Array.from(byId.values())
          saveRounds(deduped)
          setImportSuccess(`Imported ${parsed.rounds.length} round${parsed.rounds.length === 1 ? '' : 's'}`)
          setImportError(null)
          setTimeout(() => setImportSuccess(null), 3000)
        } else if (isValidRoundArray(parsed)) {
          // Plain array of rounds
          const existing = getRounds()
          const merged = [...existing, ...parsed]
          const byId = new Map<string, unknown>()
          merged.forEach((r) => {
            const id = (r as Record<string, unknown>).id as string
            if (id) byId.set(id, r)
          })
          const deduped = Array.from(byId.values())
          saveRounds(deduped)
          setImportSuccess(`Imported ${parsed.length} round${parsed.length === 1 ? '' : 's'}`)
          setImportError(null)
          setTimeout(() => setImportSuccess(null), 3000)
        } else {
          throw new Error('Invalid file format')
        }
      } catch {
        setImportError('Invalid file. Please upload a valid export JSON.')
        setImportSuccess(null)
        setTimeout(() => setImportError(null), 4000)
      }
    }
    reader.readAsText(file)

    // Reset input
    e.target.value = ''
  }, [])

  const handleClearAll = useCallback(() => {
    if (confirmText !== 'DELETE') return
    localStorage.removeItem(ROUNDS_KEY)
    localStorage.removeItem('golfer-blueprint-active-round')
    setClearDialogOpen(false)
    setConfirmText('')
  }, [confirmText])

  return (
    <div className="max-w-[800px] mx-auto px-md py-3xl pb-2xl">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="mb-8"
      >
        <h1 className="font-display text-page-title text-forest">Settings</h1>
        <p className="font-body text-body text-text-muted mt-sm">Manage your handbook.</p>
      </motion.div>

      {/* Player Profile */}
      <motion.section
        custom={0}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="rounded-md border border-border-color bg-gradient-to-b from-white to-[#F9F6F1] shadow-card p-lg mb-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <User className="w-5 h-5 text-fairway" />
          <h2 className="font-display text-section-title text-forest">Player Profile</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="font-body text-small text-text-muted">Player Name</Label>
            <Input
              placeholder="Your name..."
              value={settings.playerName}
              onChange={(e) => updateSetting('playerName', e.target.value)}
              className="h-9 bg-white border-border-color focus-visible:border-forest focus-visible:ring-forest/10"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-body text-small text-text-muted">Home Course</Label>
            <Input
              placeholder="Favorite course..."
              value={settings.homeCourse}
              onChange={(e) => updateSetting('homeCourse', e.target.value)}
              className="h-9 bg-white border-border-color focus-visible:border-forest focus-visible:ring-forest/10"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-body text-small text-text-muted">Handicap Goal</Label>
            <Input
              type="number"
              placeholder="Target handicap (e.g., 10)"
              value={settings.handicapGoal}
              onChange={(e) => updateSetting('handicapGoal', e.target.value)}
              className="h-9 bg-white border-border-color focus-visible:border-forest focus-visible:ring-forest/10"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-body text-small text-text-muted">Preferred Units</Label>
            <select
              value={settings.preferredUnits}
              onChange={(e) => updateSetting('preferredUnits', e.target.value as 'yards' | 'meters')}
              className="h-9 w-full px-3 rounded-md border border-border-color bg-white font-body text-small text-charcoal focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest/10 cursor-pointer"
            >
              <option value="yards">Yards</option>
              <option value="meters">Meters</option>
            </select>
          </div>
        </div>
      </motion.section>

      {/* Scoring Preferences */}
      <motion.section
        custom={1}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="rounded-md border border-border-color bg-gradient-to-b from-white to-[#F9F6F1] shadow-card p-lg mb-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <Sliders className="w-5 h-5 text-fairway" />
          <h2 className="font-display text-section-title text-forest">Scoring Preferences</h2>
        </div>

        <div className="flex flex-col gap-6">
          {/* Default Par */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-body text-body text-charcoal">Default Course Par</p>
              <p className="font-body text-small text-text-muted mt-0.5">
                Used for score calculations when par isn&apos;t specified.
              </p>
            </div>
            <Input
              type="number"
              min={54}
              max={90}
              step={1}
              value={settings.defaultPar}
              onChange={(e) => updateSetting('defaultPar', parseInt(e.target.value || '72', 10))}
              className="h-9 w-20 bg-white border-border-color focus-visible:border-forest focus-visible:ring-forest/10 text-center"
            />
          </div>

          {/* Auto-calculate */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-body text-body text-charcoal">Auto-calculate round totals</p>
              <p className="font-body text-small text-text-muted mt-0.5">
                Automatically sum pars, birdies, bogeys, etc. from hole-by-hole data.
              </p>
            </div>
            <Switch
              checked={settings.autoCalculateTotals}
              onCheckedChange={(v) => updateSetting('autoCalculateTotals', v)}
              className="data-[state=checked]:bg-fairway data-[state=unchecked]:bg-border-color shrink-0"
            />
          </div>

          {/* Show Distance Labels */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-body text-body text-charcoal">Show approach distance labels on green</p>
              <p className="font-body text-small text-text-muted mt-0.5">
                Display distance badges next to placed hole numbers.
              </p>
            </div>
            <Switch
              checked={settings.showDistanceLabels}
              onCheckedChange={(v) => updateSetting('showDistanceLabels', v)}
              className="data-[state=checked]:bg-fairway data-[state=unchecked]:bg-border-color shrink-0"
            />
          </div>

          {/* Confirm Before Clear */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-body text-body text-charcoal">Confirm before clearing a round</p>
              <p className="font-body text-small text-text-muted mt-0.5">
                Show a confirmation dialog when resetting round data.
              </p>
            </div>
            <Switch
              checked={settings.confirmBeforeClear}
              onCheckedChange={(v) => updateSetting('confirmBeforeClear', v)}
              className="data-[state=checked]:bg-fairway data-[state=unchecked]:bg-border-color shrink-0"
            />
          </div>
        </div>
      </motion.section>

      {/* Data Management */}
      <motion.section
        custom={2}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="rounded-md border border-border-color bg-gradient-to-b from-white to-[#F9F6F1] shadow-card p-lg mb-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <Database className="w-5 h-5 text-[#C45B4A]" />
          <h2 className="font-display text-section-title text-forest">Data Management</h2>
        </div>

        <div className="flex flex-col gap-6">
          {/* Export */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-body text-body text-charcoal">Export all round data</p>
              <p className="font-body text-small text-text-muted mt-0.5">
                Download a JSON file with all your saved rounds.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="border-border-color text-charcoal hover:bg-sand hover:border-fairway"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>

          {/* Import */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-body text-body text-charcoal">Import round data</p>
              <p className="font-body text-small text-text-muted mt-0.5">
                Upload a previously exported JSON file to restore rounds.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="application/json"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportClick}
                className="border-border-color text-charcoal hover:bg-sand hover:border-fairway"
              >
                <Upload className="w-4 h-4" />
                Import
              </Button>
            </div>
          </div>

          {importSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-light border border-fairway"
            >
              <Check className="w-4 h-4 text-forest" />
              <span className="font-body text-small text-forest">{importSuccess}</span>
            </motion.div>
          )}
          {importError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#F5E0DC] border border-[#C45B4A]/30"
            >
              <AlertTriangle className="w-4 h-4 text-flag-red" />
              <span className="font-body text-small text-flag-red">{importError}</span>
            </motion.div>
          )}

          {/* Clear All */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-border-color">
            <div>
              <p className="font-body text-body text-[#C45B4A]">Clear all data</p>
              <p className="font-body text-small text-text-muted mt-0.5">
                Permanently delete all rounds and settings. This cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setClearDialogOpen(true)}
              className="bg-flag-red text-white hover:bg-flag-red/90"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </Button>
          </div>
        </div>
      </motion.section>

      {/* About */}
      <motion.section
        custom={3}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="rounded-md border border-border-color bg-gradient-to-b from-white to-[#F9F6F1] shadow-card p-lg"
      >
        <div className="flex items-center gap-2 mb-6">
          <Info className="w-5 h-5 text-text-muted" />
          <h2 className="font-display text-section-title text-forest">About</h2>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-display text-card-title text-forest">A Golfer&apos;s Blueprint</h3>
            <p className="font-body text-small text-text-muted mt-1">v1.0.0</p>
          </div>

          <p className="font-body text-body text-charcoal">
            A premium digital golf handbook for tracking your game, analyzing your progress, and lowering your scores.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('mailto:support@golfersblueprint.app', '_blank')}
              className="text-forest hover:bg-green-light h-8 px-2"
            >
              <Mail className="w-4 h-4" />
              Send Feedback
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-forest hover:bg-green-light h-8 px-2"
            >
              Privacy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-forest hover:bg-green-light h-8 px-2"
            >
              Terms
            </Button>
          </div>

          <div className="border-t border-border-color pt-4">
            <p className="font-body text-small italic text-text-muted">
              Built with care for golfers who appreciate the details.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Clear All Confirmation Dialog */}
      <Dialog open={clearDialogOpen} onOpenChange={(open) => { if (!open) { setClearDialogOpen(false); setConfirmText('') } }}>
        <DialogContent className="bg-white border-border-color rounded-lg max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-section-title text-charcoal flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-flag-red" />
              Delete everything?
            </DialogTitle>
            <DialogDescription className="font-body text-body text-text-muted">
              All rounds, stats, and preferences will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 p-3 rounded-md bg-[#F5E0DC]/50 border border-[#C45B4A]/20">
            <p className="font-body text-small text-[#C45B4A]">
              This action cannot be undone. Type <span className="font-bold">DELETE</span> to confirm.
            </p>
          </div>
          <Input
            placeholder="Type DELETE to confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="mt-3 h-9 bg-white border-border-color focus-visible:border-forest focus-visible:ring-forest/10"
          />
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => { setClearDialogOpen(false); setConfirmText('') }}
              className="border-border-color text-charcoal hover:bg-sand hover:border-fairway"
            >
              Cancel
            </Button>
            <Button
              onClick={handleClearAll}
              disabled={confirmText !== 'DELETE'}
              className="bg-flag-red text-white hover:bg-flag-red/90 disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" />
              Delete Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
