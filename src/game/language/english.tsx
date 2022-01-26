import React from "react"
import { Language } from "."
import { defaultGameMode } from "../gamemodes"
import { UserBackXFill } from "./definitions"

export const English: Language = {
  CODE: "EN",
  id: 0,
  you: "You",
  next: "Next",
  login: "Login",
  newRoom: "New Room",
  name: "Name",
  word: "Word",
  inputUsername: "Input Username: ",
  register: "Register",
  wrongPass: "Wrong PIN!",
  players: "Players",
  max: "Max",
  notyetimplemented: "Not yet implemented",
  pinInfo: <span>PIN should consist of six digits.</span>,
  unknownReason: "For unknown reason",
  passTooShort: "Your PIN is too short",
  createRoom: {
    maxplayers: "Max players:",
    createBtn: "Create",
    dictionary: "Dictionary:",
    scoring: {
      fieldsetlegend: "Scoring",
      id0: "+1 per word",
      id1: "+1 per letter over",
      id101: "<N Gives a point",
      id101_title:
        "If someone uses a word with less then N letters they get 1 point instead of negative points",
      id2: "+1 per each letter",
    },
    wincond: {
      id1: "Unless points:",
      fieldsetlegend: "Win condition",
      endless: "Endless",
      timed: "Timed",
    },
  },
  badWord: {
    wrongStart: {
      raw: "Word starts wrongly",
      fill: ({ value }): string =>
        `The word should start at ${value.toLocaleUpperCase()}`,
    },
    alreadyIn: "Word has been already used!",
    wordError: "Incorrect word",
    notInDic: {
      raw: "Word not in dictionary!",
      fill: ({ value }) => `Word ${value} is not in dictionary`,
    },
  },

  inputPINFor: {
    raw: "Input PIN: ",
    fill: ({ value }): string => `Input PIN for ${value}: `,
    xfill: UserBackXFill("Insert PIN for", "goBack"),
  },
  loggedAs: {
    raw: "Logged in",
    fill: ({ value }) => `Logged in as ${value}:`,
    xfill: UserBackXFill("Logged in as", "logout"),
  },
  joinedRoom: {
    raw: "Joined room:",
    fill: ({ value }) => `Joined to room #${value}`,
    xfill: ({
      value,
      lang,
      mode = defaultGameMode,
      sdesc,
      length,
      wdesc,
      points,
      onClick,
    }) => (
      <div>
        Joined room #{value}[{lang}]
        {mode && (
          <>
            <br />
            <span title={sdesc}>
              Mode: {mode.scoring.id}
              {length ? <span>({length})</span> : <></>}
            </span>
            /
            <span title={wdesc}>
              {mode.wincondition.id}
              {points ? <span>({points})</span> : <></>}
            </span>
          </>
        )}
        <br />
        <span className={"goBack"} onClick={onClick}>
          Leave
        </span>
      </div>
    ),
  },

  defaultScoreDescription: "Each Word +1 Point",
  defaultWinDescription: "Endless Mode",
  scoreDescriptions: [
    {
      id: "+1overN",
      description: {
        raw: "Additional points for every letter over N",
        fill: ({ length }) =>
          `Additional points for every letter over ${length}`,
      },
    },
    {
      id: "length",
      description: "Every letter is worth one point",
    },
    {
      id: "+1overN_safe",
      description: {
        raw: "Additional points for every letter over N,\nwords shorter than N are worth only 1 point",
        fill: ({ length }) =>
          `Additional points for every letter over ${length},\nwords shorter than ${length} are worth only 1 point`,
      },
    },
  ],
  winDescriptions: [
    {
      id: "overN",
      description: {
        raw: "First over N points wins",
        fill: ({ points }) => `First over ${points} points wins`,
      },
    },
  ],
}
