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
  onWordCame: function (word: Word, refs?: GameRoomRefs): number {
    return 1
  },
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
}

export interface NNGameMode extends GameMode {
  wordToPts(word: Word): number
  onWordCame(word: Word, refs?: GameRoomRefs): number
  onPtsCame(
    points: {
      pts: number
      playerid: Exclude<number, 0>
    },
    room: Room,
    refs?: GameRoomRefs,
  ): void
  isWin(room: Room, players: Points): false | PlayerID
}

export interface GameMode {
  id: number
  description: Exclude<string, "">
  wordToPts?(word: Word): number
  onWordCame?(word: Word, refs?: GameRoomRefs): number
  onPtsCame?(
    points: {
      pts: number
      playerid: Exclude<number, 0>
    },
    room: Room,
    refs?: GameRoomRefs,
  ): void
  isWin?(room: Room, players: Points): false | PlayerID
}

export const errTimeout = 2000

export const GameModes: GameMode[] = [
  {
    id: 1,
    description: "+1over4",
    wordToPts: (word) => {
      return word.word.length - 4
    },
  },
]
