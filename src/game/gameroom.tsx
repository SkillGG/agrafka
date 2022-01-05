import React, { useRef, useEffect, useState } from "react"
import { fetchFromServer, serverdomain } from "./server"

type ConsoleMSG = {
  msg: string
  date: Date
}

import { Room, Word, Points, SendEvent } from "./base"

import "./light/room.css"
import "./dark/room.css"
import { getLanguage, Language } from "./language"
import {
  InjectableField,
  reasonToString,
} from "./language/definitions"
import { isCookie } from "./cookies"
import {
  defaultGameMode,
  errTimeout,
  GameMode,
  GameRoomRefs,
  NNGameMode,
  PlayerPointsRef,
} from "./gamemodes"
import { Reason } from "./base"

const gameRegex = /[a-z]/i

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

  const [playerPoints, setPlayerPoints] = useState<Points>(new Map())

  const [addedPoints, setAddedPoints] = useState<Points>(new Map())

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

  const wordlistRef = useRef<HTMLDivElement>(null)
  const playerlistRef = useRef<HTMLDivElement>(null)
  const userinputRef = useRef<HTMLInputElement>(null)
  const playerlistChildRef = useRef<PlayerPointsRef>({})
  const gameRoomRefs: GameRoomRefs = {
    playerList: {
      list: playerlistRef,
      elements: playerlistChildRef,
      addPointState: setAddedPoints,
    },
    textInput: userinputRef,
    wordList: wordlistRef,
  }

  const checkCookie = () => {
    if (!isCookie("loggedas")) throw history.go()
  }

  const addPointToPlayer = (id: number, n: number): void => {
    if (!roomState) return
    getGameMode(roomState).onPtsCame(
      { pts: n, playerid: id },
      roomState,
      gameRoomRefs,
    )
    console.log("setting player points")
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

  const getGameMode = (rs: Room | null): NNGameMode => {
    if (rs && rs.gamemode)
      return { ...defaultGameMode, ...rs.gamemode }
    return defaultGameMode
  }

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
      ;(sseEvent || sse).close()
    }
    sse.onerror = (ev) => {
      ev.preventDefault()
      console.error("Event", ev, sse)
      window.alert("A server error has occured!")
      leaveRoom()
      sse.close()
      onLeave()
    }
    return () => {
      ;(sseEvent || sse).close()
    }
  }, [])

  if (sseEvent) {
    sseEvent.onmessage = (ev: MessageEvent<string>) => {
      try {
        let json: SendEvent = JSON.parse(ev.data)
        const playerid = json.data.playerid
        if (!roomState) return
        switch (json.data.type) {
          case "points":
            const pts = json.data.points
            const reason = json.data.reason
            if (playerid && pts) {
              addPointToPlayer(playerid, pts)
              if (pts < 0 && playerid === playerID) {
                if (reason)
                  setWrong(
                    reasonToString(
                      language.badWord[reason],
                      language,
                      json.data.word,
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
            const word: Word = {
              id: playerid,
              word: json.data.word,
              time: json.time,
            }
            const gamemode = getGameMode(roomState)
            gamemode.onWordCame(word, gameRoomRefs)
            setWords((prev) => {
              return [...prev, word]
            })
            const wordPoints = gamemode.wordToPts(word)
            addPointToPlayer(playerid, wordPoints)
            break
          case "join":
            if (playerid && playerid !== playerID)
              getUsernameFromServer(playerid, true).then((name) => {
                if (name)
                  setCurrentUsers(
                    (prev) => new Set([...prev, playerid]),
                  )
              })
            break
          case "leave":
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
            msg: `${json.data.type}(${json.data.playerid})`,
            date: json.time ? new Date(json.time) : new Date(),
          },
        ])
      } catch (e) {}
    }
  }

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

  const badWord = async (callback: () => void, reason?: Reason) => {
    checkCookie()
    await fetchFromServer(`/game/${roomid}/wrong`, {
      method: "post",
      credentials: "include",
      body: JSON.stringify({ reason: reason || "" }),
    })
    callback()
  }

  const lastWord = words[words.length - 1] || null

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
        <div className='userlist' ref={playerlistRef}>
          {[...currentUsers].map((user: number) => {
            const key = `${user}@${roomid}`
            const addedPts = addedPoints.get(user) || null
            return (
              <div key={`${key}`}>
                {playerNames.get(user) || user}
                <span
                  ref={(el) =>
                    (playerlistChildRef.current[user] = el!)
                  }
                  key={`${key}_pts`}
                  data-playerid={user}
                  className='pts'
                >
                  {playerPoints.get(user) || 0}
                  {addedPts ? (
                    <span className={addedPts < 0 ? "plus" : "minus"}>
                      {addedPts}
                    </span>
                  ) : (
                    <></>
                  )}
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
            ref={userinputRef}
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
