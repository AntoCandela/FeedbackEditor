import { useEffect, useRef, type ReactNode } from 'react'
import type { OnboardingStep } from './steps'

interface OnboardingTooltipProps {
  stepData: OnboardingStep
  stepIndex: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
  onDismiss: () => void
  anchorRect: DOMRect | null
}

export function OnboardingTooltip({
  stepData,
  stepIndex,
  totalSteps,
  onNext,
  onBack,
  onDismiss,
  anchorRect,
}: OnboardingTooltipProps): ReactNode {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>(
      'button, [role="button"]',
    )
    if (buttons.length === 0) return

    buttons[0].focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return

      const focusable = Array.from(buttons)
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    const el = containerRef.current
    el.addEventListener('keydown', handleKeyDown)
    return () => el.removeEventListener('keydown', handleKeyDown)
  }, [stepIndex])

  if (!anchorRect) return null

  const top = Math.min(anchorRect.bottom + 12, window.innerHeight - 220)
  const left = Math.max(
    12,
    Math.min(anchorRect.left, window.innerWidth - 340),
  )

  const isLastStep = stepIndex === totalSteps - 1

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Onboarding step ${stepIndex + 1} of ${totalSteps}: ${stepData.title}`}
      className="fixed z-[60] w-80 bg-white rounded-xl shadow-xl border border-[var(--border)] p-4"
      style={{ top, left }}
    >
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center">
          {stepIndex + 1}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-[var(--text-primary)]">
            {stepData.title}
          </h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
            {stepData.description}
          </p>
          {stepData.shortcut && (
            <kbd className="mt-2 inline-block px-1.5 py-0.5 text-[10px] font-mono bg-gray-100 border border-gray-300 rounded text-[var(--text-tertiary)]">
              {stepData.shortcut}
            </kbd>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
        >
          Skip
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--text-tertiary)]">
            {stepIndex + 1}/{totalSteps}
          </span>

          {stepIndex > 0 && (
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1 text-xs font-medium rounded-md border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-alt)] transition-colors"
            >
              Back
            </button>
          )}

          <button
            type="button"
            onClick={onNext}
            className="px-3 py-1 text-xs font-medium rounded-md bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
          >
            {isLastStep ? 'Get started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
