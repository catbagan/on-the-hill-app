import { useState, useCallback } from "react"

export type HeadToHeadSortType =
  | "name-asc"
  | "name-desc"
  | "matches-asc"
  | "matches-desc"
  | "winrate-asc"
  | "winrate-desc"

export type SkillSortType = "skill-asc" | "skill-desc" | "winrate-asc" | "winrate-desc"

export type SkillDiffSortType = "diff-asc" | "diff-desc" | "winrate-asc" | "winrate-desc"

export type NameWinrateSortType = "name-asc" | "name-desc" | "winrate-asc" | "winrate-desc"

export type PositionSortType = "position-asc" | "position-desc" | "winrate-asc" | "winrate-desc"

export type InningsSortType = "innings-asc" | "innings-desc" | "winrate-asc" | "winrate-desc"

export type ScoreSortType = "score-asc" | "score-desc" | "count-asc" | "count-desc"

export interface SortState {
  headToHead: HeadToHeadSortType
  mySkill: SkillSortType
  oppSkill: SkillSortType
  skillDiff: SkillDiffSortType
  location: NameWinrateSortType
  position: PositionSortType
  innings: InningsSortType
  teamSituation: NameWinrateSortType
  score: ScoreSortType
}

const DEFAULT_SORTS: SortState = {
  headToHead: "name-asc",
  mySkill: "skill-asc",
  oppSkill: "skill-asc",
  skillDiff: "diff-asc",
  location: "name-asc",
  position: "position-asc",
  innings: "innings-asc",
  teamSituation: "name-asc",
  score: "score-asc",
}

export function useSortState() {
  const [sorts, setSorts] = useState<SortState>(DEFAULT_SORTS)

  const setSort = useCallback(<K extends keyof SortState>(key: K, value: SortState[K]) => {
    setSorts((prev) => ({ ...prev, [key]: value }))
  }, [])

  const resetSorts = useCallback(() => {
    setSorts(DEFAULT_SORTS)
  }, [])

  return { sorts, setSort, resetSorts }
}
