import type { Comment } from '../comments/types'

export interface Version {
  id: string
  markdown: string
  comments: Comment[]
  timestamp: number
  trigger: 'copy' | 'paste'
}
