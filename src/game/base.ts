import { GameMode, ScoringSystems, WinConditions } from "./gamemodes"
import { getLangList } from "./language"

export type PlayerID = Exclude<number, 0>

export type Reason =
  | "notInDic"
  | "alreadyIn"
  | "wrongStart"
  | "wordError"
  | undefined

type InOutEvent = {
  data: {
    type: "leave" | "join"
    playerid: PlayerID
  }
}

type FinishEvent = {
  data: {
    type: "win"
    playerid: PlayerID
  }
}

type PointEvent = {
  data: {
    type: "points"
    playerid: PlayerID
    points: number
    reason?: Reason
    word?: string
  }
}

type InputEvent = {
  data: {
    type: "input"
    playerid: PlayerID
    word: string
  }
}

type CheckEvent = {
  data: {
    type: "check"
    playerid: PlayerID
  }
}

export type WinConditionIDs = 0 | 1

export type WinConditionData = { points?: number }

export type ScoreIDs = 0 | 1 | 2 | 101
export type ScoringData = { length?: number }

export type LangIDs = 0 | 1

export type NewRoomData = {
  WinCondition: { id: WinConditionIDs; data: WinConditionData }
  Score: { id: ScoreIDs; data: ScoringData }
  MaxPlayers: number
  Dictionary: LangIDs
}

export const existsScore = (n: number): n is ScoreIDs =>
  !!ScoringSystems.find((sc) => n === sc.id)

export const existsWinCondition = (n: number): n is WinConditionIDs =>
  !!WinConditions.find((sc) => n === sc.id)

export const existsLanguage = (n: number): n is LangIDs =>
  !!getLangList().find((l) => l.id === n)

export type SendEvent = (
  | CheckEvent
  | InOutEvent
  | PointEvent
  | InputEvent
  | FinishEvent
) & {
  time: number
}

export type Word = {
  /**
   * Player ID
   */
  playerid: PlayerID
  /**
   * Time, the word was sent
   */
  time: number
  /**
   * Text of the word
   */
  word: string
}

export type Room = {
  /**
   * How room is sored in the database
   */
  state: string
  /**
   * Array of IDs of players currently in the room
   */
  players: PlayerID[]
  /**
   * ID of the player who created/is the owner of the room
   */
  creator: PlayerID
  /**
   * Room's various rules
   */
  gamemode?: GameMode
  /**
   * Room's gamemode data
   */
  creationdata: NewRoomData
}

/**
 * List of points of each player
 */
export type Points = Map<Exclude<number, 0>, Exclude<number, 0>>
