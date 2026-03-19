import { useCallback, useEffect, useSyncExternalStore, type ReactNode } from 'react'
import { useOnboarding } from './useOnboarding'
import { ONBOARDING_STEPS } from './steps'
import { OnboardingTooltip } from './OnboardingTooltip'

function useAnchorRect(active: boolean, step: number): DOMRect | null {
  const subscribe = useCallback(
    (notify: () => void) => {
      window.addEventListener('resize', notify)
      return () => window.removeEventListener('resize', notify)
    },
    [],
  )

  const getSnapshot = useCallback((): DOMRect | null => {
    if (!active) return null
    const selector = ONBOARDING_STEPS[step]?.anchorSelector
    if (!selector) return null
    const el = document.querySelector(selector)
    return el ? el.getBoundingClientRect() : null
  }, [active, step])

  return useSyncExternalStore(subscribe, getSnapshot)
}

export function OnboardingOverlay(): ReactNode {
  const { active, step, totalSteps, next, back, dismiss } = useOnboarding()
  const anchorRect = useAnchorRect(active, step)

  useEffect(() => {
    if (!active) return

    function handleKeyDown(e: KeyboardEvent) {
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
