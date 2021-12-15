import React, { SetStateAction, useState } from "react"

import RoomList from "./roomlist"
import Login, { loginStates } from "./login"

import "./game.css"
import { setSyntheticLeadingComments } from "typescript"
import { fetchFromServer } from "./server"
import GameRoom, { Room } from "./gameroom"

export type UserData = {
  id: number
  name: string
}

export default function Game() {
  const [logged, setLogged] = useState<number | null>(null)
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

  return (
    <>
      <Login data={setUserData} />
      {logged && selectRoom && <RoomList onJoin={onJoin} />}
      {joined && !selectRoom && data && (
        <GameRoom
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
