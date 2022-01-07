import React from "react"
import {
  defaultGameMode,
  GameMode,
  GameModes,
  NNGameMode,
} from "../gamemodes"
import {
  InjectableField,
  UserBackXFill,
  XFillOnClick,
} from "./definitions"

const langList: Language[] = []

export const getLanguage = (lang: number) =>
  langList[lang % langList.length]

export type Language = {
  CODE: "EN" | "PL"
  next: string
  you: string
  login: string
  inputUsername: string
  register: string
  players: string
  max: string
  inputPINFor: XFillOnClick<{ value: string }>
  loggedAs: XFillOnClick<{ value: string }>
  wrongPass: string
  joinedRoom: XFillOnClick<{
    value: string
    lang: string
    desc: string
    mode: NNGameMode
  }>
  pinInfo: JSX.Element
  unknownReason: string
  name: string
  word: string
  passTooShort: string
  badWord: {
    wrongStart: InjectableField<{ value: string }>
    alreadyIn: string
    wordError: string
    notInDic: InjectableField<{ value: string }>
  }

  defaultGamemodeDescription: string
  gamemodeDescriptions: { id: string; description: string }[]
}

const English: Language = {
  CODE: "EN",
  you: "You",
  next: "Next",
  login: "Login",
  name: "Name",
  word: "Word",
  inputUsername: "Input Username: ",
  register: "Register",
  wrongPass: "Wrong PIN!",
  players: "Players",
  max: "Max",
  pinInfo: <span>PIN should consist of six digits.</span>,
  unknownReason: "For unknown reason",
  passTooShort: "Your PIN is too short",
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
      desc,
      onClick,
    }) => (
      <div>
        Joined room #{value}[{lang}]
        {mode && (
          <>
            <br />
            <span title={desc}>Mode: {mode.id}</span>
          </>
        )}
        <br />
        <span className={"goBack"} onClick={onClick}>
          Leave
        </span>
      </div>
    ),
  },

  defaultGamemodeDescription: "Default Gamemode\nsss",
  gamemodeDescriptions: [
    {
      id: "+1over4",
      description: "Additional points for every letter over 4",
    },
  ],
}

const Polish: Language = {
  CODE: "PL",
  next: "Dalej",
  you: "Ty",
  login: "Zaloguj",
  register: "Zarejestruj",
  name: "Gracz",
  word: "Słowo",
  inputUsername: "Podaj nazwę: ",
  wrongPass: "Zły PIN!",
  players: "Graczy",
  max: "Max",
  pinInfo: <span>PIN powinien składać się z sześciu cyfr.</span>,
  unknownReason: "Z nieznanego powodu",
  passTooShort: "Twój PIN jest zbyt krótki",
  badWord: {
    alreadyIn: "Słowo już użyte!",
    wordError: "Niepoprawne słowo",
    wrongStart: {
      raw: "Słowo się źle zaczyna",
      fill: ({ value }): string =>
        `Słowo powinno zaczynać się na ${value
          .charAt(0)
          .toLocaleUpperCase()}`,
    },
    notInDic: {
      raw: "Słowa nie ma w słowniku",
      fill: ({ value }) => `Słowo ${value} nie jest w słowniku`,
    },
  },

  inputPINFor: {
    raw: "Podaj PIN: ",
    fill: ({ value }) => `Podaj PIN dla ${value}: `,
    xfill: UserBackXFill("Podaj PIN dla", "goBack"),
  },
  loggedAs: {
    raw: "Zalogowano",
    fill: ({ value }) => `Zalogowano jako ${value}:`,
    xfill: UserBackXFill("Zalogowano jako", "logout"),
  },
  joinedRoom: {
    raw: "W pokoju:",
    fill: ({ value }) => `W pokoju #${value}`,
    xfill: ({
      value,
      lang,
      mode = defaultGameMode,
      desc,
      onClick,
    }) => (
      <div>
        W pokoju #{value}[{lang}]
        {mode && (
          <>
            <br />
            <span title={desc}>Tryb: {mode.id}</span>
          </>
        )}
        <br />
        <span className={"goBack"} onClick={onClick}>
          Wyjdź
        </span>
      </div>
    ),
  },

  defaultGamemodeDescription: "Domyślny tryb\nsss",
  gamemodeDescriptions: [
    {
      id: "+1over4",
      description: "Dodatkowy punkt za każdą literę powyżej 4",
    },
  ],
}

langList.push(English)
langList.push(Polish)
