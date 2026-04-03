export interface HomeMediaItem {
  id: string
  title: string
  genre: string
  duration: string
}

export interface ContinueWatchingItem {
  id: string
  title: string
  progress: number
  episode?: string
}
