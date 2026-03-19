export interface OnboardingStep {
  title: string
  description: string
  anchorSelector: string
  shortcut?: string
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: 'Paste your content',
    description:
      "Paste any AI-generated text into the editor. It's your starting point.",
    anchorSelector: '.ProseMirror',
  },
  {
    title: 'Select & comment',
    description: 'Highlight any text to see the comment button.',
    anchorSelector: '.ProseMirror',
    shortcut: '⌘K',
  },
  {
    title: 'Copy & send back',
    description:
      'Your feedback is embedded as instructions the AI can follow.',
    anchorSelector: '[data-testid="copy-button"]',
    shortcut: '⌘↵',
  },
]
