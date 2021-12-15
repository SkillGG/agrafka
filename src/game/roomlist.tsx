import React, { useEffect, useState } from "react"

type RoomListElement = {
  id: number
  inside: number
  max: number
}

import { fetchFromServer } from "./server"

import "./roomlist.css"

export default function RoomList({
  onJoin,
}: {
  onJoin: (fn: () => { roomid: number }) => void
}) {
  const [roomList, setRoomList] = useState<null | RoomListElement[]>(
    null,
  )

  const [timeoutInterval, setTimeoutInterval] = useState(1500)

  const getUserRoom = async () => {
    const res = await fetchFromServer("/game/where", {
      credentials: "include",
      method: "post",
    })
    if (res.status === 200) {
      const room = await res.response
      onJoin(() => ({ roomid: parseInt(room) }))
    }
  }

  const getRoomList = async () => {
    setRoomList([])
    const int_date = new Date()
    const res = await fetchFromServer("/game/list")
    const rooms = await res.response
    const regx = rooms.matchAll(
      /(?<id>\d+?)\[(?<inside>\d+?\/(?<max>\d+?))\]/g,
    )
    for (const match of regx) {
      if (match.groups) {
        const { id, inside, max } = match.groups
        setRoomList((prev) => {
          const newRoom: RoomListElement = {
            id: parseInt(id),
            max: parseInt(max),
            inside: parseInt(inside),
          }
          if (prev) return [...prev, newRoom]
          else return [newRoom]
        })
      }
    }
    const time = new Date().getTime() - int_date.getTime()
    setTimeoutInterval(5000 + time)
  }

  useEffect(() => {
    getUserRoom()
  }, [])

  useEffect(() => {
    getRoomList()
  }, [])

  useEffect(() => {
    const timerid = setTimeout(() => getRoomList(), timeoutInterval)
    return () => clearInterval(timerid)
  })

  const joinRoom = (roomid: number) => {
    const room = roomList?.find((room) => room.id === roomid)
    if (room && room.inside < room.max) onJoin(() => ({ roomid }))
  }

  return (
    <div id='roomlist'>
      <table>
        <thead>
          <tr>
            <th style={{ width: "10%" }}>#</th>
            <th style={{ width: "40%" }}>Graczy / Max</th>
            <th className={"refresh"} onClick={() => getRoomList()}>
              🔄
            </th>
          </tr>
        </thead>
        <tbody>
          {roomList &&
            roomList.map((r) => {
              return (
                <tr key={r.id}>
                  <td className='roomid'>{r.id}.</td>
                  <td className='roomcapacity'>
                    {r.inside}/{r.max}
                  </td>
                  <td
                    onClick={() => {
                      joinRoom(r.id)
                    }}
                    className='roomjoin'
                  >
                    Dołącz
                  </td>
                </tr>
              )
            })}
        </tbody>
      </table>
    </div>
  )
}
