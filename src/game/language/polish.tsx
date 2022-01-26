import React from "react"
import { Language } from "."
import { defaultGameMode } from "../gamemodes"
import { UserBackXFill } from "./definitions"

export const Polish: Language = {
  CODE: "PL",
  id: 1,
  next: "Dalej",
  you: "Ty",
  login: "Zaloguj",
  newRoom: "Nowy Pokój",
  register: "Zarejestruj",
  name: "Gracz",
  word: "Słowo",
  inputUsername: "Podaj nazwę: ",
  wrongPass: "Zły PIN!",
  players: "Graczy",
  max: "Max",
  notyetimplemented: "Jeszcze nie zaimplementowano",
  createRoom: {
    maxplayers: "Max graczy:",
    createBtn: "Stwórz",
    dictionary: "Słownik:",
    scoring: {
      fieldsetlegend: "Punktacja",
      id0: "+1 za słowo",
      id1: "+1 za każdą literę powyżej",
      id101: "<N Daje punkt",
      id101_title:
        "Jeżeli ktoś poda słowo krótsze niż 5 doda punkt zamiast odejmować",
      id2: "+1 za każdą literę w słowie",
    },
    wincond: {
      id1: "Dopóki:",
      fieldsetlegend: "Warunki zwycięstwa",
      endless: "Nieskończone",
      timed: "Na czas",
    },
  },
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
    xfill: ({ value, lang, mode, sdesc, points, wdesc, onClick }) => (
      <div>
        W pokoju #{value}[{lang}]
        {mode && (
          <>
            <br />
            <span title={sdesc}>
              Tryb: {mode.scoring.id}
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
          Wyjdź
        </span>
      </div>
    ),
  },

  defaultScoreDescription: "Każde słowo warte +1 punkt",
  defaultWinDescription: "Tryb nieskończony",
  winDescriptions: [
    {
      id: "overN",
      description: {
        raw: "Powyżej N punktów",
        fill: ({ points }) =>
          `Wygrywa pierwszy powyżej ${points} punktów`,
      },
    },
  ],
  scoreDescriptions: [
    {
      id: "+1overN",
      description: {
        raw: "Dodatkowy punkt za każdą literę powyżej N",
        fill: ({ length }) =>
          `Dodatkowy punkt za każdą literę powyżej ${length}`,
      },
    },
    {
      id: "length",
      description: "Każda litera słowa jest równa 1 punkt",
    },
    {
      id: "+1overN_safe",
      description: {
        raw: "Dodatkowy punkt za każdą literę powyżej N,\nsłowa poniżej N liczą się jako 1 punkt",
        fill: ({ length }) =>
          `Dodatkowy punkt za każdą literę powyżej ${length},\nsłowa poniżej ${length} liczą się jako 1 punkt`,
      },
    },
  ],
}
