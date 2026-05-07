import { useCallback, useEffect, useRef, useState } from 'react';
import { Save, FileDown, Trash2, RefreshCw, CheckCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { Round } from '@/hooks/useRounds';
import {
  getDefaultRound,
  getActiveRound,
  saveActiveRound,
  clearActiveRound,
  saveRound,
} from '@/hooks/useRounds';
import FairwayTracking from '@/components/new-round/FairwayTracking';
import ApproachTracking from '@/components/new-round/ApproachTracking';
import StatsPanel from '@/components/new-round/StatsPanel';

export default function NewRound() {
  const pageRef = useRef<HTMLDivElement>(null);
  const [round, setRound] = useState<Round>(() => {
    const saved = getActiveRound();
    return saved ? { ...saved } : getDefaultRound();
  });

  const [showResumePrompt, setShowResumePrompt] = useState(() => {
    const saved = getActiveRound();
    return !!saved;
  });

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-save draft every 5 seconds
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      saveActiveRound(round);
    }, 5000);
  }, [round]);

  useEffect(() => {
    triggerAutoSave();
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [triggerAutoSave]);

  const updateField = useCallback(
    <K extends keyof Round>(key: K, value: Round[K]) => {
      setRound((prev) => {
        const next = { ...prev, [key]: value };
        return next;
      });
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    },
    []
  );

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!round.date) nextErrors.date = 'Date is required';
    if (!round.course.trim()) nextErrors.course = 'Course name is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const toSave = { ...round };
    if (!toSave.id) toSave.id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    saveRound(toSave);
    clearActiveRound();
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleClear = () => {
    setRound(getDefaultRound());
    clearActiveRound();
    setErrors({});
    setShowClearConfirm(false);
  };

  const handleResume = () => {
    const saved = getActiveRound();
    if (saved) setRound({ ...saved });
    setShowResumePrompt(false);
  };

  const handleStartFresh = () => {
    clearActiveRound();
    setRound(getDefaultRound());
    setShowResumePrompt(false);
  };

  const handleExportPDF = async () => {
    if (!pageRef.current) return;
    const canvas = await html2canvas(pageRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#F5F0E8',
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let position = 10;
    let heightLeft = imgHeight;

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 20;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;
    }

    pdf.save(`round-${round.date || 'export'}.pdf`);
  };

  const resetPositions = () => {
    setRound((prev) => ({ ...prev, fairwayPlacements: {}, approachPlacements: {} }));
  };

  return (
    <div className="bg-parchment min-h-[100dvh]">
      {/* Toast */}
      {showToast && (
        <div className="fixed top-6 right-6 z-[100] bg-forest text-white rounded-md shadow-card-hover px-md py-sm flex items-center gap-sm animate-[slideIn_300ms_ease-out-expo]">
          <CheckCircle className="w-5 h-5" />
          <span className="font-body text-small font-medium">Round saved successfully</span>
        </div>
      )}

      {/* Resume Prompt Modal */}
      {showResumePrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(0,0,0,0.3)] backdrop-blur-[4px]">
          <div className="bg-white rounded-md border border-border-color shadow-card-hover max-w-[400px] w-full mx-md p-lg">
            <h3 className="font-display text-section-title text-forest mb-sm">Resume previous round?</h3>
            <p className="font-body text-body text-charcoal mb-lg">
              A saved draft was found. Would you like to resume where you left off or start fresh?
            </p>
            <div className="flex items-center gap-md justify-end">
              <button
                onClick={handleStartFresh}
                className="px-md py-sm rounded-sm border border-border-color font-body text-small text-charcoal hover:bg-sand transition-colors duration-150 ease-smooth"
              >
                Start Fresh
              </button>
              <button
                onClick={handleResume}
                className="px-md py-sm rounded-sm font-body text-small font-semibold text-white bg-forest hover:shadow-button-primary-hover active:scale-[0.98] transition-all duration-150 ease-smooth"
              >
                Resume
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(0,0,0,0.3)] backdrop-blur-[4px]">
          <div className="bg-white rounded-md border border-border-color shadow-card-hover max-w-[400px] w-full mx-md p-lg scale-100">
            <h3 className="font-display text-section-title text-forest mb-sm">Clear this round?</h3>
            <p className="font-body text-body text-charcoal mb-lg">
              All data will be reset. This cannot be undone.
            </p>
            <div className="flex items-center gap-md justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-md py-sm rounded-sm border border-border-color font-body text-small text-charcoal hover:bg-sand transition-colors duration-150 ease-smooth"
              >
                Cancel
              </button>
              <button
                onClick={handleClear}
                className="px-md py-sm rounded-sm font-body text-small font-semibold text-white bg-flag-red hover:opacity-90 active:scale-[0.98] transition-all duration-150 ease-smooth"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Content */}
      <div ref={pageRef} className="max-w-[1000px] mx-auto px-md pt-[calc(3rem+64px)] pb-3xl">
        {/* Section 1: Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md mb-2xl">
          <div>
            <h1 className="font-display text-page-title text-forest">Round Tracker</h1>
            <p className="font-body text-body text-text-muted mt-xs">
              Record every shot. Know your game.
            </p>
          </div>
          <div className="flex items-center gap-sm flex-wrap">
            <button
              onClick={resetPositions}
              className="flex items-center gap-2 px-md py-sm rounded-sm border border-border-color font-body text-small text-charcoal hover:bg-sand transition-colors duration-150 ease-smooth"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Positions
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-md py-sm rounded-sm border border-border-color font-body text-small text-charcoal hover:bg-sand transition-colors duration-150 ease-smooth"
            >
              <FileDown className="w-4 h-4" />
              Export to PDF
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-md py-sm rounded-sm font-body text-small font-semibold text-white bg-forest hover:shadow-button-primary-hover active:scale-[0.98] transition-all duration-150 ease-smooth"
            >
              <Save className="w-4 h-4" />
              Save Round
            </button>
          </div>
        </div>

        {/* Content container with paper feel */}
        <div className="flex flex-col gap-xl" style={{ boxShadow: '0 0 60px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.08)' }}>
          {/* Section 2: Header Fields */}
          <section className="bg-white rounded-md border border-border-color shadow-card p-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
              <div>
                <label className="block font-body text-small text-text-muted font-medium mb-xs">Date</label>
                <input
                  type="date"
                  value={round.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  className={`w-full px-sm py-sm rounded-sm border bg-white font-body text-body text-charcoal focus:outline-none focus:border-forest focus:ring-[3px] focus:ring-[rgba(74,107,62,0.1)] transition-all duration-200 ease-smooth ${
                    errors.date ? 'border-flag-red' : 'border-border-color'
                  }`}
                />
                {errors.date && <p className="font-body text-small text-flag-red mt-xs">{errors.date}</p>}
              </div>

              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block font-body text-small text-text-muted font-medium mb-xs">Course</label>
                <input
                  type="text"
                  placeholder="Course name..."
                  value={round.course}
                  onChange={(e) => updateField('course', e.target.value)}
                  className={`w-full px-sm py-sm rounded-sm border bg-white font-body text-body text-charcoal focus:outline-none focus:border-forest focus:ring-[3px] focus:ring-[rgba(74,107,62,0.1)] transition-all duration-200 ease-smooth ${
                    errors.course ? 'border-flag-red' : 'border-border-color'
                  }`}
                />
                {errors.course && <p className="font-body text-small text-flag-red mt-xs">{errors.course}</p>}
              </div>

              <div>
                <label className="block font-body text-small text-text-muted font-medium mb-xs">Tee Time</label>
                <input
                  type="time"
                  value={round.teeTime || ''}
                  onChange={(e) => updateField('teeTime', e.target.value)}
                  className="w-full px-sm py-sm rounded-sm border border-border-color bg-white font-body text-body text-charcoal focus:outline-none focus:border-forest focus:ring-[3px] focus:ring-[rgba(74,107,62,0.1)] transition-all duration-200 ease-smooth"
                />
              </div>

              <div>
                <label className="block font-body text-small text-text-muted font-medium mb-xs">Stock Shot Shape for Today</label>
                <select
                  value={round.stockShotShape || ''}
                  onChange={(e) => updateField('stockShotShape', e.target.value)}
                  className="w-full px-sm py-sm rounded-sm border border-border-color bg-white font-body text-body text-charcoal focus:outline-none focus:border-forest focus:ring-[3px] focus:ring-[rgba(74,107,62,0.1)] transition-all duration-200 ease-smooth"
                >
                  <option value="">Select shape...</option>
                  <option value="Straight">Straight</option>
                  <option value="Draw">Draw</option>
                  <option value="Fade">Fade</option>
                  <option value="Hook">Hook</option>
                  <option value="Slice">Slice</option>
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block font-body text-small text-text-muted font-medium mb-xs">Goals</label>
                <textarea
                  rows={2}
                  placeholder="Today's goals..."
                  value={round.goals || ''}
                  onChange={(e) => updateField('goals', e.target.value)}
                  className="w-full px-sm py-sm rounded-sm border border-border-color bg-white font-body text-body text-charcoal focus:outline-none focus:border-forest focus:ring-[3px] focus:ring-[rgba(74,107,62,0.1)] transition-all duration-200 ease-smooth resize-y min-h-[64px]"
                />
              </div>
            </div>
          </section>

          {/* Section 3: Fairway Tracking */}
          <FairwayTracking
            placements={round.fairwayPlacements}
            onChange={(placements) => updateField('fairwayPlacements', placements)}
          />

          {/* Section 4: Approach Tracking */}
          <ApproachTracking
            placements={round.approachPlacements}
            onChange={(placements) => updateField('approachPlacements', placements)}
          />

          {/* Section 5: Stats Panel */}
          <StatsPanel stats={round.stats} onChange={(stats) => updateField('stats', stats)} />

          {/* Section 6: Notes */}
          <section className="bg-white rounded-md border border-border-color shadow-card p-lg">
            <div className="flex items-center gap-sm mb-md">
              <h2 className="font-display text-section-title text-forest">Notes</h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                <path d="m15 5 4 4" />
              </svg>
            </div>
            <textarea
              rows={4}
              maxLength={500}
              placeholder="What worked today? What needs practice? Wind conditions? Club choices?"
              value={round.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              className="w-full px-sm py-sm rounded-sm border border-border-color bg-white font-body text-body text-charcoal leading-[1.7] focus:outline-none focus:border-forest focus:ring-[3px] focus:ring-[rgba(74,107,62,0.1)] transition-all duration-200 ease-smooth resize-y min-h-[120px] max-h-[300px]"
            />
            <div className="text-right mt-xs">
              <span className="font-body text-small text-text-muted">{round.notes.length} / 500</span>
            </div>
          </section>
        </div>

        {/* Section 7: Action Footer */}
        <div className="sticky bottom-0 mt-xl py-lg bg-[rgba(245,240,232,0.9)] backdrop-blur-[8px] border-t border-border-color z-40">
          <div className="flex items-center justify-center gap-md flex-wrap">
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 px-md py-sm rounded-sm font-body text-small font-semibold text-white bg-flag-red hover:opacity-90 active:scale-[0.98] transition-all duration-150 ease-smooth"
            >
              <Trash2 className="w-4 h-4" />
              Clear Round
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-lg py-sm rounded-sm font-body text-small font-semibold text-white bg-forest hover:shadow-button-primary-hover active:scale-[0.98] transition-all duration-150 ease-smooth"
            >
              <Save className="w-4 h-4" />
              Save Round
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-md py-sm rounded-sm border border-border-color font-body text-small text-charcoal hover:bg-sand transition-colors duration-150 ease-smooth"
            >
              <FileDown className="w-4 h-4" />
              Export to PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
