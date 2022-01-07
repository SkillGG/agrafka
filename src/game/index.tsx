import React, { SetStateAction, useState, useEffect } from "react"

import { Moon, Sunny } from "react-ionicons"

import RoomList from "./roomlist"
import Login from "./login"

import "./light/index.css"
import { fetchFromServer } from "./server"
import GameRoom from "./gameroom"
import { getCookie, isCookie } from "./cookies"
import { getLanguage } from "./language"
import { ErrorCode } from "./errors"

import "./dark/index.css"
import { Room } from "./base"
import { QueryError } from "mysql2"
import { defaultGameMode, GameModes } from "./gamemodes"

export type UserData = {
  id: number
  name: string
}

export default function Game() {
  const [logged, setLogged] = useState<number | null>(null)

  const language =
    parseInt(localStorage.getItem("lang") || "", 10) || 0

  const [data, setData] = useState<UserData | null>(null)

  const [darkMode, setDarkMode] = useState(false)

  const [selectRoom, setSelect] = useState(false)
  const [joined, setJoined] = useState<number | null>(null)

  const [roomState, setRoomState] = useState<Room | null>(null)

  const setUserData = (
    fn: () => { id: number; name: string } | null,
  ) => {
    const data = fn()
    setData(data)
    setSelect(!!data)
    setLogged(data ? data.id : null)
  }

  const checkCookie = () => {
    if (!isCookie("loggedas")) {
      setLogged(null)
      setData(null)
      window.history.go()
      return false
    }
    return true
  }
  const onJoin = async (fn: () => { roomid: number }) => {
    const { roomid } = fn()
    if (!checkCookie()) return
    const { status, response } = await fetchFromServer(
      `/game/${roomid}/join`,
      {
        credentials: "include",
        method: "post",
        body: "",
      },
    )
    if (status === 200) {
      setJoined(roomid)
      let room: Room & { status?: number } = JSON.parse(
        await response,
      )
      room.gamemode = {
        ...room.gamemode,
        ...(GameModes.find((g) => g.id === room.modeid) ||
          defaultGameMode),
      }
      delete room.status
      setRoomState(room)
      setSelect(false)
    }
  }

  const onLeave = () => {
    if (joined) {
      setJoined(null)
      setSelect(true)
    }
  }

  /** Auto login if cookie is set */
  useEffect(() => {
    if (window.localStorage.getItem("darkmode") === "on") {
      setDarkMode(true)
      document.body.classList.add("dark")
    }
    if (isCookie("loggedas")) {
      const loggedas = getCookie(
        "loggedas",
        ...[],
        (str) => !!/d+/.exec(str),
      )
      console.log("Logged in as ", loggedas)
      fetchFromServer(`/user/id/${loggedas}`).then(
        ({ status, response }) => {
          if (status === 200) {
            response.then((name) => {
              console.log("got name!", name)
              setUserData(() => ({
                id: parseInt(loggedas, 10),
                name,
              }))
            })
          }
        },
      )
    }
  }, [])
  const lang = getLanguage(language)

  return (
    <>
      <div className='settings'>
        <div
          className='uiMode'
          onClick={(e) => {
            darkMode
              ? window.localStorage.setItem("darkmode", "")
              : window.localStorage.setItem("darkmode", "on")
            setDarkMode(!darkMode)
            darkMode
              ? document.body.classList.remove("dark")
              : document.body.classList.add("dark")
          }}
        >
          {darkMode ? (
            <Sunny color='white' />
          ) : (
            <Moon color='black' />
          )}
        </div>
        <div
          className='uiLang'
          onClick={(e) => {
            localStorage.setItem("lang", `${language + 1}`)
            window.history.go()
          }}
        >
          {lang.CODE}
        </div>
      </div>
      <Login
        language={lang}
        dark={darkMode}
        data={setUserData}
        logged={data || undefined}
      />
      {logged && selectRoom && (
        <RoomList language={lang} onJoin={onJoin} dark={darkMode} />
      )}
      {joined && !selectRoom && data && (
        <GameRoom
          dark={darkMode}
          language={lang}
          roomid={joined}
          playerID={logged || 0}
          playerName={data.name}
          roomState={roomState}
          onLeave={onLeave}
        />
      )}
    </>
  )
}
