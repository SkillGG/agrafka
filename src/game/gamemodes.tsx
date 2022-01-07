import React from "react"
import { Word, Room, Points, PlayerID } from "./base"

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

export const defaultGameMode: NNGameMode = {
  wordToPts: function (word: Word): number {
    return 1
  },
  onWordCame: function (word: Word, refs?: GameRoomRefs): void {},
  onPtsCame: (
    points: { pts: number; playerid: number },
    room: Room,
    refs?: GameRoomRefs,
  ) => {
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
  isWin: function (room: Room, players: Points): number | false {
    return false
  },
  id: 0,
  description: "default options",
  wordCSSClass: () => "",
}

export const gmToNN = (gm?: GameMode) => {
  if (gm) {
    const mode = typeof gm === "number" ? GameModes[gm] : gm
    return { ...defaultGameMode, ...mode }
  } else return defaultGameMode
}

export interface NNGameMode extends GameMode {
  wordToPts(word: Word): number
  onWordCame(word: Word, refs?: GameRoomRefs): void
  onPtsCame(
    points: {
      pts: number
      playerid: Exclude<number, 0>
    },
    room: Room,
    refs?: GameRoomRefs,
  ): void
  isWin(room: Room, players: Points): false | PlayerID
  wordCSSClass: (w: Word) => string
}

export interface GameMode {
  id: number
  description: Exclude<string, "">
  wordToPts?(word: Word): number
  onWordCame?(word: Word, refs?: GameRoomRefs): void
  onPtsCame?(
    points: {
      pts: number
      playerid: Exclude<number, 0>
    },
    room: Room,
    refs?: GameRoomRefs,
  ): void
  isWin?(room: Room, players: Points): false | PlayerID
  wordCSSClass?: (w: Word) => string
}

export const errTimeout = 2000

export const GameModes: GameMode[] = [
  {
    id: 1,
    description: "+1over4",
    wordToPts: (word) => {
      return word.word.length - 4
    },
    wordCSSClass: (w) =>
      `plus1over4 ${w.word.length < 4 ? "plus1over4_bad" : ""}`,
  },
]
