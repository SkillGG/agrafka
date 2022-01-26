import React, { useEffect, useRef, useState } from "react"

import { Set as iSet, Map as iMap } from "immutable"

type RoomListElement = {
  id: number
  inside: number
  max: number
}

import { fetchFromServer } from "./server"

import "./light/list.css"
import "./dark/list.css"
import "./light/modal.css"
import "./dark/modal.css"

import { getLangList, Language } from "./language"
import { isCookie } from "./cookies"
import { Refresh } from "react-ionicons"
import {
  existsLanguage,
  existsScore,
  NewRoomData,
  ScoreIDs,
} from "./base"

type RoomMap = iMap<"id" | "inside" | "max", number>

type RoomList = null | iSet<RoomMap>

export default function RoomList({
  onJoin,
  language,
  dark,
}: {
  onJoin: (fn: () => { roomid: number }) => void
  language: Language
  dark: boolean
}) {
  const [roomList, setRoomList] = useState<RoomList>(null)

  const [timeoutInterval, setTimeoutInterval] = useState(1500)

  const checkCookie = () => {
    if (!isCookie("loggedas")) throw window.history.go()
  }

  const getUserRoom = async () => {
    checkCookie()
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
    checkCookie()
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

  const [roomModal, setRoomModal] = useState(false)

  const getRoom = (id: number) => {
    return roomList?.find((room) => room.get("id") === id)
  }

  const joinRoom = (roomid: number) => {
    console.log("join room", roomid)
    const room = getRoom(roomid)
    console.log("Room", room)
    if (!room) return
    const inside = room.get("inside")
    const max = room.get("max")
    if ((!inside && inside !== 0) || (!max && max !== 0)) return
    if (inside < max) onJoin(() => ({ roomid }))
  }

  const createNewRoom = async (data: NewRoomData) => {
    console.log(data)
    const { response, status } = await fetchFromServer(
      "/game/create",
      {
        method: "post",
        credentials: "include",
        body: JSON.stringify(data),
      },
    )
    if (status === 200) {
      const res: { id: number } = JSON.parse(await response)
      console.log("response", res.id)
      setRoomModal(false)
      await getRoomList()
      setTimeout(
        () =>
          onJoin(() => ({
            roomid: res.id,
          })),
        100,
      )
      // const el = window.document.querySelector(
      //   `#roomrow${res.id} td:last-child`,
      // ) as HTMLTableCellElement
      // console.log(el)
      // el?.click()
    } else {
      alert("Error creating room!")
    }
  }

  const [newRoom, setNewRoom] = useState<NewRoomData>({
    WinCondition: { id: 0, data: {} },
    Score: { id: 0, data: {} },
    MaxPlayers: 4,
    Dictionary: 0,
  })
  const [newRoomGM1_data, setNewRoomGM1_data] = useState({
    length: 4,
  })
  const [unlessData, setUnlessData] = useState({ points: 100 })

  return (
    <div id='roomlist' className={dark ? "dark" : ""}>
      {roomModal && (
        <div
          className='modal'
          onClick={(e) => {
            console.log("clicked modal")
            if (e.currentTarget.classList.contains("modal")) {
              setRoomModal(false)
            }
          }}
        >
          <div
            className='modalcontent'
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <label htmlFor='maxpl'>
              {language.createRoom.maxplayers}
            </label>
            <input
              type='number'
              name='maxpl'
              id='nr_max'
              max={12}
              min={1}
              value={newRoom.MaxPlayers}
              onChange={(e) => {
                if (e.target.checkValidity())
                  setNewRoom((p) => ({
                    ...p,
                    MaxPlayers: parseInt(e.target.value, 10),
                  }))
              }}
            />
            <label htmlFor='dic'>
              {language.createRoom.dictionary}
            </label>
            <select
              value={newRoom.Dictionary}
              onChange={(e) => {
                const idic = parseInt(e.currentTarget.value, 10)
                console.log("changed lang", idic)
                if (existsLanguage(idic))
                  setNewRoom((prev) => ({
                    ...prev,
                    Dictionary: idic,
                  }))
              }}
              name='dic'
              id='dic'
            >
              {getLangList().map((l) => {
                return (
                  <option key={`lang_opt_${l.id}`} value={l.id}>
                    {l.CODE}
                  </option>
                )
              })}
            </select>
            <fieldset>
              <legend>
                {language.createRoom.scoring.fieldsetlegend}
              </legend>
              <div className='option'>
                <input
                  checked={newRoom.Score.id === 0}
                  type='radio'
                  name='score'
                  id='nr_score0'
                  onChange={() =>
                    setNewRoom((prev) => ({
                      ...prev,
                      Score: { id: 0, data: {} },
                    }))
                  }
                />
                <label htmlFor='nr_score0'>
                  {language.createRoom.scoring.id0}
                </label>
              </div>
              <div className='option'>
                <input
                  checked={newRoom.Score.id % 100 === 1}
                  type='radio'
                  name='score'
                  id='nr_score1'
                  onChange={() =>
                    setNewRoom((prev) => ({
                      ...prev,
                      Score: { id: 1, data: newRoomGM1_data },
                    }))
                  }
                />
                <label htmlFor='nr_score1'>
                  {language.createRoom.scoring.id1}
                </label>
                <input
                  type='number'
                  id={"gm1_length"}
                  value={newRoomGM1_data.length || ""}
                  onChange={(e) => {
                    setNewRoomGM1_data({
                      length: parseInt(e.target.value),
                    })
                    setNewRoom((prev) => ({
                      ...prev,
                      Score: {
                        ...prev.Score,
                        data: {
                          length: parseInt(e.target.value, 10),
                        },
                      },
                    }))
                  }}
                />
                {newRoom.Score.id % 100 === 1 && (
                  <>
                    <input
                      type='checkbox'
                      id='nr_score1_safe'
                      checked={!(newRoom.Score.id === 1)}
                      onChange={(e) => {
                        const sc = 1 + (e.target.checked ? 100 : 0)
                        if (existsScore(sc))
                          setNewRoom((prev) => {
                            return {
                              ...prev,
                              Score: { ...prev.Score, id: sc },
                            }
                          })
                      }}
                    />
                    <label
                      htmlFor='nr_score1_safe'
                      title={language.createRoom.scoring.id101_title}
                    >
                      {language.createRoom.scoring.id101}
                    </label>
                  </>
                )}
              </div>
              <div className='option'>
                <input
                  checked={newRoom.Score.id === 2}
                  type='radio'
                  name='score'
                  id='nr_score2'
                  onChange={() =>
                    setNewRoom((prev) => ({
                      ...prev,
                      Score: { id: 2, data: {} },
                    }))
                  }
                />
                <label htmlFor='nr_score2'>
                  {language.createRoom.scoring.id2}
                </label>
              </div>
            </fieldset>
            <fieldset>
              <legend>
                {language.createRoom.wincond.fieldsetlegend}
              </legend>
              <div className='constoption'>
                <label
                  title={language.notyetimplemented}
                  htmlFor='nr_wincond_timed'
                >
                  {language.createRoom.wincond.timed}
                </label>
                <input
                  type='checkbox'
                  name='wincond_timed'
                  id='nr_wincond_timed'
                  disabled={true}
                  title={language.notyetimplemented}
                />
              </div>
              <div className='option'>
                <input
                  checked={newRoom.WinCondition.id === 0}
                  onChange={() =>
                    setNewRoom((p) => ({
                      ...p,
                      WinCondition: { id: 0, data: {} },
                    }))
                  }
                  type='radio'
                  name='wincond'
                  id='nr_wincond0'
                />
                <label htmlFor='nr_wincond0'>
                  {language.createRoom.wincond.endless}
                </label>
              </div>
              <div className='option'>
                <input
                  checked={newRoom.WinCondition.id === 1}
                  onChange={() =>
                    setNewRoom((p) => ({
                      ...p,
                      WinCondition: { id: 1, data: unlessData },
                    }))
                  }
                  type='radio'
                  name='wincond'
                  id='nr_wincond1'
                />
                <label htmlFor='nr_wincond1'>
                  {language.createRoom.wincond.id1}
                </label>
                {newRoom.WinCondition.id === 1 && (
                  <input
                    id='unless_pts'
                    className={"constoption"}
                    type='text'
                    value={unlessData.points || ""}
                    onChange={(e) => {
                      const pts = parseInt(e.target.value || "", 10)
                      setUnlessData({ points: pts })
                      setNewRoom((p) => ({
                        ...p,
                        WinCondition: {
                          id: 1,
                          data: {
                            points: pts,
                          },
                        },
                      }))
                    }}
                  />
                )}
              </div>
            </fieldset>
            <button
              onClick={() => {
                createNewRoom(newRoom)
              }}
            >
              {language.createRoom.createBtn}
            </button>
          </div>
        </div>
      )}
      <table>
        <thead>
          <tr>
            <th style={{ width: "10%" }}>#</th>
            <th style={{ width: "40%" }}>
              {language.players} / {language.max}
            </th>
            <th className={"refresh"} onClick={() => getRoomList()}>
              <Refresh color={dark ? "white" : "black"} />
            </th>
          </tr>
        </thead>
        <tbody>
          {roomList &&
            roomList
              .sort((a, b) => (a.get("id") || 0) - (b.get("id") || 0))
              .map((room: RoomMap) => {
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
                    <tr id={`roomrow${r.id}`} key={r.id}>
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
          {
            <tr>
              <td
                colSpan={3}
                style={{ textAlign: "center", cursor: "pointer" }}
                onClick={(e) => {
                  setRoomModal(true)
                }}
              >
                {language.newRoom}
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  )
}
