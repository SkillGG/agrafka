import React, { EventHandler, MouseEventHandler } from "react"

const langList: Language[] = []

export const getLanguage = (lang: number) => {
  return langList[lang % langList.length]
}

export type InjectableField<T> = {
  raw: string
  fill(fill: T): string
}

export type XFill<T> = {
  xfill?(fill: T): JSX.Element
}

export type XFillOnClick<T> = InjectableField<T> &
  XFill<T & { onClick: MouseEventHandler }>

export type Language = {
  CODE: "EN" | "PL"
  next: string
  login: string
  inputUsername: string
  register: string
  players: string
  max: string
  inputPINFor: XFillOnClick<{ value: string }>
  loggedAs: XFillOnClick<{ value: string }>
  wrongPass: string
  joinedRoom: XFillOnClick<{ value: string }>
  // word: string
}

const UserBackXFill = (inp: string, cls: string) => {
  return ({
    value,
    onClick,
  }: {
    value: string
    onClick: MouseEventHandler
  }) => (
    <>
      {inp}{" "}
      <span className={cls} onClick={onClick}>
        {value}
      </span>
      :
    </>
  )
}

const English: Language = {
  CODE: "EN",
  next: "Next",
  login: "Login",
  inputUsername: "Input Username: ",
  register: "Register",
  wrongPass: "Wrong PIN!",
  players: "Players",
  max: "Max",

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
    xfill: UserBackXFill("Joined in as", "goBack"),
  },
}

const Polish: Language = {
  CODE: "PL",
  next: "Dalej",
  login: "Zaloguj",
  register: "Zarejestruj",
  inputUsername: "Podaj nazwę: ",
  wrongPass: "Zły PIN!",
  players: "Graczy",
  max: "Max",

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
    xfill: UserBackXFill("W pokoju", "goBack"),
  },
}

langList.push(English)
langList.push(Polish)
