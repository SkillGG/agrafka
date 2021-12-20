import React, { SetStateAction, useState, useEffect } from "react"

import RoomList from "./roomlist"
import Login from "./login"

import "./game.css"
import { fetchFromServer } from "./server"
import GameRoom, { Room } from "./gameroom"
import { getCookie, isCookie } from "./cookies"
import { getLanguage } from "./language"

export type UserData = {
  id: number
  name: string
}

export default function Game() {
  const [logged, setLogged] = useState<number | null>(null)

  const language =
    parseInt(localStorage.getItem("lang") || "", 10) || 0

  const [data, setData] = useState<UserData | null>(null)

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

  const onJoin = async (fn: () => { roomid: number }) => {
    const { roomid } = fn()
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
      <div
        className='uiLang'
        onClick={(e) => {
          localStorage.setItem("lang", `${language + 1}`)
          window.history.go()
        }}
      >
        {lang.CODE}
      </div>
      <Login
        language={lang}
        data={setUserData}
        logged={data || undefined}
      />
      {logged && selectRoom && (
        <RoomList language={lang} onJoin={onJoin} />
      )}
      {joined && !selectRoom && data && (
        <GameRoom
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
