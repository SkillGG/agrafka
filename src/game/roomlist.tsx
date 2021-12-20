import React, { useEffect, useState } from "react"

import { Set as iSet, Map as iMap } from "immutable"

type RoomListElement = {
  id: number
  inside: number
  max: number
}

import { fetchFromServer } from "./server"

import "./roomlist.css"
import { Language } from "./language"
import { ModifierSyntaxKind } from "typescript"

type RoomMap = iMap<"id" | "inside" | "max", number>

type RoomList = null | iSet<RoomMap>

export default function RoomList({
  onJoin,
  language,
}: {
  onJoin: (fn: () => { roomid: number }) => void
  language: Language
}) {
  const [roomList, setRoomList] = useState<RoomList>(null)

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
    setRoomList(iSet<RoomMap>())
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
          const newRoom: RoomMap = iMap({
            id: parseInt(id),
            max: parseInt(max),
            inside: parseInt(inside),
          }) as RoomMap
          if (prev) {
            if (!prev.has(newRoom)) {
              return iSet([...prev, newRoom])
            }
            return prev
          } else return iSet([newRoom])
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

  const getRoom = (id: number) => {
    return roomList?.find((room) => room.get("id") === id)
  }

  const joinRoom = (roomid: number) => {
    const room = getRoom(roomid)
    if (!room) return
    const inside = room.get("inside")
    const max = room.get("max")
    if ((!inside && inside !== 0) || (!max && max !== 0)) return
    if (inside < max) onJoin(() => ({ roomid }))
  }

  return (
    <div id='roomlist'>
      <table>
        <thead>
          <tr>
            <th style={{ width: "10%" }}>#</th>
            <th style={{ width: "40%" }}>
              {language.players} / {language.max}
            </th>
            <th className={"refresh"} onClick={() => getRoomList()}>
              🔄
            </th>
          </tr>
        </thead>
        <tbody>
          {roomList &&
            roomList.map((room: RoomMap) => {
              const r = {
                id: room.get("id"),
                inside: room.get("inside"),
                max: room.get("max"),
              }
              if (
                r.id === undefined ||
                r.inside === undefined ||
                r.max === undefined
              )
                return <></>
              else
                return (
                  <tr key={r.id}>
                    <td className='roomid'>{r.id}.</td>
                    <td className='roomcapacity'>
                      {r.inside}/{r.max}
                    </td>
                    <td
                      onClick={() => {
                        r.id !== undefined && joinRoom(r.id)
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
