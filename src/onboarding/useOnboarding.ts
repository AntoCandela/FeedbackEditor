import { useState, useCallback } from 'react'
import { ONBOARDING_STEPS } from './steps'

const STORAGE_KEY = 'feedbackeditor-onboarding:v1'

export interface OnboardingState {
  active: boolean
  step: number
  totalSteps: number
  next: () => void
  back: () => void
  dismiss: () => void
}

export function useOnboarding(): OnboardingState {
  const [active, setActive] = useState(
    () => localStorage.getItem(STORAGE_KEY) !== 'done',
  )
  const [step, setStep] = useState(0)

  const totalSteps = ONBOARDING_STEPS.length

  const dismiss = useCallback(() => {
    setActive(false)
    localStorage.setItem(STORAGE_KEY, 'done')
  }, [])

  const next = useCallback(() => {
    setStep((current) => {
      if (current >= totalSteps - 1) {
        dismiss()
        return current
      }
      return current + 1
    })
  }, [totalSteps, dismiss])

  const back = useCallback(() => {
    setStep((current) => Math.max(0, current - 1))
  }, [])

  return { active, step, totalSteps, next, back, dismiss }
}
