import React from "react"
import {
  Word,
  Room,
  Points,
  PlayerID,
  ScoreIDs,
  WinConditionIDs,
  WinConditionData,
} from "./base"

export interface PlayerPointsRef {
  [key: number]: HTMLSpanElement
}

export type PointStateSetter = React.Dispatch<
  React.SetStateAction<Map<number, number>>
>
export interface GameRoomRefs {
  textInput: React.RefObject<HTMLInputElement>
  wordList: React.RefObject<HTMLDivElement>
  playerList: {
    elements: React.RefObject<PlayerPointsRef>
    list: React.RefObject<HTMLDivElement>
    addPointState: PointStateSetter
  }
}

export interface ModeInfo {
  description: string
}

export interface Scoring extends ModeInfo {
  id: ScoreIDs
  wordToPts(word: Word, room: Room): number
  onWordCame(word: Word, refs?: GameRoomRefs): void
  onPtsCame(
    points: {
      pts: number
      playerid: Exclude<number, 0>
    },
    room: Room,
    refs?: GameRoomRefs,
  ): void
  wordCSSClass: (w: Word, room: Room) => string
  letterCSSClass: (w: Word, i: number, room: Room) => string
}

export interface WinCondition extends ModeInfo {
  id: WinConditionIDs
  isWin(room: Room, players: Points): false | PlayerID
}

export interface GameMode {
  scoring: Scoring
  wincondition: WinCondition
}

export const defaultScoring: Scoring = {
  wordToPts() {
    return 1
  },
  onWordCame() {},
  onPtsCame(points, room, refs) {
    const { pts, playerid } = points
    console.log("onptscame:", points)
    if (pts == 0) return
    if (refs) {
      refs.playerList.addPointState((prev) => {
        return new Map([...prev, [playerid, pts]])
      })
      setTimeout(() => {
        refs.playerList.addPointState(
          (prev) => new Map([...prev, [playerid, 0]]),
        )
      }, errTimeout)
    }
  },
  letterCSSClass: () => "",
  wordCSSClass: () => "",
  id: 0,
  description: "default",
}

export const defaultWinCondition: WinCondition = {
  isWin() {
    return false
  },
  id: 0,
  description: "default",
}

export const defaultGameMode: GameMode = {
  scoring: defaultScoring,
  wincondition: defaultWinCondition,
}

export const errTimeout = 2000

const GM1_DEFAULTDATA = { length: 4 }

export const ScoringSystems: Scoring[] = [
  defaultScoring,
  {
    ...defaultScoring,
    id: 1,
    description: "+1overN",
    wordToPts(word, room) {
      const { length = GM1_DEFAULTDATA.length } =
        room.creationdata.Score.data
      return word.word.length - length
    },
    wordCSSClass(word, room) {
      const { length = GM1_DEFAULTDATA.length } =
        room.creationdata.Score.data
      return `plus1overN ${
        word.word.length < length ? "plus1overN_bad" : ""
      }`
    },
    letterCSSClass(w, i, room) {
      const { length = GM1_DEFAULTDATA.length } =
        room.creationdata.Score.data
      return (i >= length && "pointed") || ""
    },
  },
  {
    ...defaultScoring,
    id: 2,
    description: "length",
    wordToPts: (word) => word.word.length,
  },
  {
    ...defaultScoring,
    id: 101,
    description: "+1overN_safe",
    wordToPts(word, room) {
      const { length = GM1_DEFAULTDATA.length } =
        room.creationdata.Score.data
      return word.word.length > length ? word.word.length - length : 1
    },
    wordCSSClass: () => `plus1overN_safe`,
    letterCSSClass(w, i, room) {
      const { length = GM1_DEFAULTDATA.length } =
        room.creationdata.Score.data
      return (i >= length && "pointed") || ""
    },
  },
]

export const WinConditions: WinCondition[] = [
  defaultWinCondition,
  {
    description: "overN",
    id: 1,
    isWin(room, points) {
      const { points: maxpts } = room.creationdata.WinCondition.data
      if (maxpts) {
        const winner = [...points].find((pts) => {
          return pts[1] >= maxpts
        })
        if (winner) return winner[0]
      }
      return false
    },
  },
]
