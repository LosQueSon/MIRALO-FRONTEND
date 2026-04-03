import { ContinueWatchingItem, HomeMediaItem } from "@/features/home/types"

export const featuredItem: HomeMediaItem = {
  id: "f-1",
  title: "Across The Spider Verse",
  genre: "Animation",
  duration: "2h 20m",
}

export const trendingItems: HomeMediaItem[] = [
  { id: "t-1", title: "Never Have I Ever", genre: "Comedy", duration: "45m" },
  { id: "t-2", title: "Lucifer", genre: "Fantasy", duration: "52m" },
  { id: "t-3", title: "Wednesday", genre: "Mystery", duration: "48m" },
]

export const recommendedItems: HomeMediaItem[] = [
  { id: "r-1", title: "Harry Potter", genre: "Fantasy", duration: "2h 32m" },
  { id: "r-2", title: "Interstellar", genre: "Sci-Fi", duration: "2h 49m" },
  { id: "r-3", title: "Inception", genre: "Sci-Fi", duration: "2h 28m" },
  { id: "r-4", title: "Tenet", genre: "Action", duration: "2h 30m" },
]

export const continueWatchingItems: ContinueWatchingItem[] = [
  { id: "c-1", title: "Money Heist", episode: "S03 E05", progress: 62 },
  { id: "c-2", title: "Wednesday", episode: "E09", progress: 35 },
  { id: "c-3", title: "Never Have I Ever", episode: "S02 E07", progress: 74 },
]
