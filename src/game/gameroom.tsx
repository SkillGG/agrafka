import React, { useRef, useEffect, useState } from "react"
import { fetchFromServer, serverdomain } from "./server"

type ConsoleMSG = {
  msg: string
  date: Date
}

type Word = {
  id: number
  time: number
  word: string
}

export type Room = {
  state: string
  currplayers: number[]
  language: number
  creator: number
}

import "./light/room.css"
import "./dark/room.css"
import { getLanguage, Language } from "./language"
import {
  InjectableField,
  reasonToString,
} from "./language/definitions"
import { isCookie } from "./cookies"

const gameRegex = /[a-z]/i

type WrongReason =
  | "notInDic"
  | "alreadyIn"
  | "wrongStart"
  | "wordError"
  | undefined

export default function GameRoom({
  roomid,
  roomState,
  playerID,
  playerName,
  language,
  onLeave,
  dark,
}: {
  roomid: number
  roomState: Room | null
  playerID: number
  playerName: string
  language: Language
  onLeave: () => void
  dark: boolean
}) {
  const [consoleMessages, setConsoleMessages] = useState<
    ConsoleMSG[]
  >([])

  const [words, setWords] = useState<Word[]>([])

  const [playerPoints, setPlayerPoints] = useState<
    Map<number, number>
  >(new Map([[1, 0]]))

  const [text, setText] = useState("")

  const [showConsole, setShowConsole] = useState(false)

  const [playerNames, setPlayerNames] = useState<Map<number, string>>(
    new Map(),
  )

  const [currentUsers, setCurrentUsers] = useState<Set<number>>(
    new Set(),
  )

  const [error, setError] = useState<string | null>(null)
  const [wrong, setWrong] = useState<string | JSX.Element>("")

  const checkCookie = () => {
    if (!isCookie("loggedas")) throw history.go()
  }

  const addPointToPlayer = (id: number, n: number): void => {
    setPlayerPoints(
      new Map<number, number>(
        [...playerPoints].map((pts) => {
          return [pts[0], pts[0] === id ? pts[1] + n : pts[1]]
        }),
      ),
    )
  }

  const leaveRoom = () => (
    checkCookie(),
    fetchFromServer(`/game/${roomid}/leave`, {
      credentials: "include",
      method: "post",
    })
  )

  let oldPop: (ev: PopStateEvent) => any

  const playPattern = /[a-ząćęółńśżź]+/i

  useEffect(() => {
    window.history.pushState(null, "", window.location.href)
    window.onpopstate = oldPop = (ev) => {
      window.onpopstate = () => {}
      ev.preventDefault()
      ev.stopPropagation()
      leaveRoom()
    }

    const curplayers = roomState?.currplayers
    curplayers?.forEach((id) => {
      if (id)
        getUsernameFromServer(id, true).then(
          (name) =>
            name && setCurrentUsers((prev) => new Set([...prev, id])),
        )
    })

    const tempPoints = new Map()
    const ptsstaterx = roomState?.state.matchAll(
      /(?<player>\d+)(?<pts>\-+)/gi,
    )
    if (ptsstaterx) {
      // calc neg pts
      for (const match of ptsstaterx) {
        if (match.groups) {
          const { player, pts } = match.groups
          const id = parseInt(player, 10)
          const reduce = pts.length
          tempPoints.set(id, -reduce)
        }
      }
    }

    const staterx = roomState?.state.matchAll(
      /(?<player>\d+?)(?<word>[a-ząćęółńśżź]+)(?<t>\d+?);/gi,
    )
    if (staterx) {
      setWords([])
      const idset: Set<number> = new Set()
      for (const match of staterx) {
        if (match.groups) {
          const { player, word, t } = match.groups
          const time = parseInt(t, 10)
          const id = parseInt(player, 10)
          idset.add(id)
          setWords((prev) => {
            return [...prev, { id, word, time }]
          })
          tempPoints.set(id, (tempPoints.get(id) || 0) + 1)
        }
      }
      for (const id of idset) {
        getUsernameFromServer(id, true)
      }
      setPlayerPoints(tempPoints)
    }
  }, [])

  const [sseEvent, setSseEvent] = useState<EventSource>()

  useEffect(() => {
    const sse = 
      sseEvent ||
      new EventSource(`${serverdomain}/events/${roomid}`, {
        withCredentials: true,
      })
    setSseEvent(sse)
    window.onpopstate = (ev) => {
      oldPop(ev)
    }
    window.onbeforeunload = () => {
      sse.close()
    }
    sse.onerror = (ev) => {
      ev.preventDefault()
      console.error("Event", ev, sse)
      window.alert("A server error has occured!")
      leaveRoom()
      sse.close()
      onLeave()
    }
  }, [])

  if (sseEvent) {
    sseEvent.onmessage = (ev) => {
      try {
        let json = JSON.parse(ev.data)
        const playerid = parseInt(json.data.playerid) || 0
        switch (json.data.type) {
          case "points":
            const pts = parseInt(json.data.data.pts, 10)
            const reason: WrongReason = json.data.data.reason
            if (playerid && pts) {
              addPointToPlayer(playerid, pts)
              if (pts < 0 && playerid === playerID) {
                if (reason)
                  setWrong(
                    reasonToString(
                      language.badWord[reason],
                      language,
                      json.data.data.word,
                    ),
                  )
                setError(language.badWord.wordError)
              }
            }
            break
          case "input":
            if (
              playerid &&
              playerid !== playerID &&
              !playerNames.has(playerid)
            ) {
              getUsernameFromServer(playerid, true)
            }
            setWords((prev) => {
              return [
                ...prev,
                {
                  id: json.data.playerid,
                  word: json.data.data,
                  time: json.time,
                },
              ]
            })
            addPointToPlayer(playerid, 1)
            break
          case "joined":
            if (playerid && playerid !== playerID)
              getUsernameFromServer(playerid, true).then((name) => {
                if (name)
                  setCurrentUsers(
                    (prev) => new Set([...prev, playerid]),
                  )
              })
            break
          case "left":
            if (playerid && playerid !== playerID) {
              setCurrentUsers(
                (prev) =>
                  new Set([...prev].filter((f) => f !== playerid)),
              )
            }
            if (playerid && playerID === playerid) {
              sseEvent.close()
              onLeave()
              return
            }
            break
        }
        setConsoleMessages((prev) => [
          ...prev,
          {
            msg: `${json.data.type}(${json.data.data})`,
            date: new Date(json.time || undefined),
          },
        ])
      } catch (e) {}
    }
  }

  const wordlistRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    wordlistRef.current
      ?.querySelector(".word:last-child")
      ?.scrollIntoView()
  }, [words])

  const getUsernameFromServer = async (
    id: number,
    save: boolean = false,
  ): Promise<string | null> => {
    if (playerNames.has(id)) return playerNames.get(id) || null
    const { status, response } = await fetchFromServer(
      `/user/id/${id}`,
    )
    if (status === 200) {
      let res = await response
      if (save)
        setPlayerNames((prev) => new Map([...prev, [id, res]]))
      return res
    } else {
      return null
    }
  }

  const scrollToCSS = (
    css: string,
    callback?: (el: Element) => void,
    pre: boolean = false,
  ) => {
    const el = wordlistRef.current?.querySelector(css)
    if (pre) if (el) callback?.(el)
    el?.scrollIntoView()
    if (!pre) if (el) callback?.(el)
  }

  const scrollDown = () => scrollToCSS(`.word:last-child`)

  const badWord = async (
    callback: () => void,
    reason?: WrongReason,
  ) => {
    checkCookie()
    await fetchFromServer(`/game/${roomid}/wrong`, {
      method: "post",
      credentials: "include",
      body: JSON.stringify({ reason: reason || "" }),
    })
    callback()
  }

  const lastWord = words[words.length - 1] || null

  const errTimeout = 2000

  const sendWord = async (word: string) => {
    if (!isCookie("loggedas")) throw window.history.go()
    if (word) {
      word = word.toLocaleLowerCase()
      const lastListWord = lastWord?.word
      const lastChar = lastListWord
        ? lastListWord.charAt(lastListWord.length - 1)
        : null
      if (
        words.find(
          (w) =>
            w.word.toLocaleLowerCase() === word.toLocaleLowerCase(),
        )
      ) {
        setWrong(language.badWord.alreadyIn)
        badWord(() => {
          scrollToCSS(
            `.word[data-word='${word}']`,
            (el) => {
              el.classList.add("bad")
              setTimeout(() => {
                el.classList.remove("bad")
                scrollDown()
              }, errTimeout)
            },
            true,
          )
        })
        setText("")
      } else if (lastChar && lastChar !== word.charAt(0)) {
        setWrong(
          language.badWord.wrongStart.fill({ value: lastChar }),
        )
        badWord(() => {
          scrollToCSS(
            `.word:last-child > :last-child`,
            (el) => {
              let tempInner = el.textContent || ""
              el.innerHTML = `${tempInner.substring(
                0,
                tempInner.length - 1,
              )}<span class='badLetter'>${tempInner.substring(
                tempInner.length - 1,
              )}</span>`
              setTimeout(() => (el.innerHTML = tempInner), errTimeout)
            },
            true,
          )
        })
      } else if (playPattern.exec(word)) {
        checkCookie()
        await fetchFromServer(`/game/${roomid}/send`, {
          method: "post",
          body: word,
          credentials: "include",
        })
        setText("")
      } else {
        setError("Słowo może się tylko składać z liter!")
      }
    } else {
      setError("Słowo nie może być puste!")
    }
  }

  window.onkeydown = (ev) => {
    if (ev.key === "`") {
      ev.preventDefault()
      ev.stopPropagation()
      setShowConsole((prev) => !prev)
    }
  }

  if (playerID === 0) return <>Error!</>

  const darkClass = dark ? "dark" : ""

  return (
    <div className={`gameroom ${darkClass}`}>
      {language.joinedRoom.xfill?.({
        value: `${roomid}`,
        lang: getLanguage(roomState?.language || 0).CODE,
        onClick: () => leaveRoom(),
      }) ||
        language.joinedRoom.fill({
          value: `${roomid}`,
          lang: language.CODE,
        })}
      <div className='gamelist'>
        <div className='wordlist' ref={wordlistRef}>
          <div className='gamehead'>
            <div>{language.name}</div>
            <div>{language.word}</div>
          </div>
          {words.map((word) => {
            return (
              <div
                data-word={word.word}
                className='gamehead word'
                id={`${word.time}:${word.id}`}
                key={`${word.time}:${word.id}`}
              >
                <div className='playerid'>
                  {word.id === playerID
                    ? language.you
                    : playerNames.get(word.id) || word.id}
                  :
                </div>
                <div className='text'>{word.word}</div>
              </div>
            )
          })}
        </div>
      </div>
      <div className='bottomPane'>
        <div className='userlist'>
          {[...currentUsers].map((user) => {
            const key = `${user}@${roomid}`
            return (
              <div key={`${key}`}>
                {playerNames.get(user) || user}
                <span key={`${key}_pts`} className='pts'>
                  {playerPoints.get(user) || 0}
                </span>
              </div>
            )
          })}
        </div>
        <div className='userInput'>
          <input
            type='text'
            value={text}
            onKeyUp={(e) => {
              setError(null)
              if (e.key === "Enter") {
                if (text) {
                  if (lastWord?.id !== playerID)
                    if (text != "") sendWord(text)
                }
              }
            }}
            onChange={(e) => setText(e.currentTarget.value)}
          />
          <input
            disabled={lastWord?.id !== playerID ? false : true}
            type='button'
            value='Send'
            onClick={(ev) => {
              sendWord(text)
              ;(
                ev.currentTarget.previousSibling as HTMLInputElement
              ).focus()
            }}
          />
        </div>
      </div>
      {error && (
        <div className='error'>
          {wrong}
          <br />
          {error}
        </div>
      )}
      {showConsole && (
        <div id='console'>
          {consoleMessages.map((msg, i) => {
            return <div key={`${roomid}${msg.date}`}>{msg.msg}</div>
          })}
        </div>
      )}
    </div>
  )
}
