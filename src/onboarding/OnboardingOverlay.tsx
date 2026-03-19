import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { useOnboarding } from './useOnboarding'
import { ONBOARDING_STEPS } from './steps'
import { OnboardingTooltip } from './OnboardingTooltip'

function getAnchorRect(active: boolean, step: number): DOMRect | null {
  if (!active) return null
  const selector = ONBOARDING_STEPS[step]?.anchorSelector
  if (!selector) return null
  const el = document.querySelector(selector)
  return el ? el.getBoundingClientRect() : null
}

export function OnboardingOverlay(): ReactNode {
  const { active, step, totalSteps, next, back, dismiss } = useOnboarding()
  // Initial value computed during render; resize updates via effect
  const [anchorRect, setAnchorRect] = useState(() => getAnchorRect(active, step))

  const handleResize = useCallback(() => {
    setAnchorRect(getAnchorRect(active, step))
  }, [active, step])

  // Re-compute when step changes (lazy init only runs on mount)
  // Using a key pattern: track step to detect changes
  const [prevStep, setPrevStep] = useState(step)
  if (step !== prevStep) {
    setPrevStep(step)
    setAnchorRect(getAnchorRect(active, step))
  }

  useEffect(() => {
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [handleResize])

  useEffect(() => {
    if (!active) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [active, dismiss])

  if (!active) return null

  const stepData = ONBOARDING_STEPS[step]
  if (!stepData) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30"
        onClick={dismiss}
        aria-hidden="true"
      />
      <OnboardingTooltip
        stepData={stepData}
        stepIndex={step}
        totalSteps={totalSteps}
        onNext={next}
        onBack={back}
        onDismiss={dismiss}
        anchorRect={anchorRect}
      />
    </>
  )
}
