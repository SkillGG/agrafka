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
}

import "./gameroom.css"
import { Language } from "./language"

const gameRegex = /[a-z]/i

export default function GameRoom({
  roomid,
  roomState,
  playerID,
  playerName,
  language,
  onLeave,
}: {
  roomid: number
  roomState: Room | null
  playerID: number
  playerName: string
  language: Language
  onLeave: () => void
}) {
  const [consoleMessages, setConsoleMessages] = useState<
    ConsoleMSG[]
  >([])

  const [words, setWords] = useState<Word[]>([])

  const [playerPoints, setPlayerPoints] = useState<
    Map<number, number>
  >(new Map())

  const [text, setText] = useState("")

  const [showConsole, setShowConsole] = useState(false)

  const [playerNames, setPlayerNames] = useState<Map<number, string>>(
    new Map(),
  )

  const [currentUsers, setCurrentUsers] = useState<Set<number>>(
    new Set(),
  )

  const [error, setError] = useState<string | null>(null)

  const addPointToPlayer = (id: number, n: number): void => {
    console.log("addpts", id, n)
    setPlayerPoints(
      (prev) =>
        new Map(
          [...prev].map(([pid, pts]) => [
            pid,
            pid === id ? pts + n : pts,
          ]),
        ),
    )
  }

  const leaveRoom = () =>
    fetchFromServer(`/game/${roomid}/leave`, {
      credentials: "include",
      method: "post",
    })

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

  const listen = () => {
    const sse = new EventSource(
      `${serverdomain}/events/${roomid}`,
      { withCredentials: true },
    )
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
    sse.onmessage = (ev) => {
      try {
        let json = JSON.parse(ev.data)
        const playerid = parseInt(json.data.playerid) || 0
        switch (json.data.type) {
          case "points":
            const pts = parseInt(json.data.data, 10)
            if (playerid && pts) {
              addPointToPlayer(playerid, pts)
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
              sse.close()
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

  useEffect(() => {
    listen()
  }, [])

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

  const badWord = async (callback: () => void) => {
    await fetchFromServer(`/game/${roomid}/wrong`, {
      method: "post",
      credentials: "include",
    })
    callback()
  }

  const sendWord = async (word: string) => {
    if (word) {
      word = word.toLocaleLowerCase()
      const lastListWord = words[words.length - 1].word
      if (
        words.find(
          (w) =>
            w.word.toLocaleLowerCase() === word.toLocaleLowerCase(),
        )
      ) {
        badWord(() => {
          scrollToCSS(`.word[data-word='${word}']`, (el) => {
            el.classList.add("bad")
            setTimeout(() => {
              el.classList.remove("bad")
              scrollDown()
            }, 1000)
          })
        })
        setText("")
      } else if (
        lastListWord.charAt(lastListWord.length - 1) !==
        word.charAt(0)
      ) {
        console.log(word, lastListWord)
        badWord(() => {
          scrollToCSS(
            `.word:last-child > :last-child`,
            (el) => {
              console.log(el)
              let tempInner = el.innerHTML
              el.innerHTML = `${tempInner.substr(0,tempInner.length-1)}<span class='badLetter'>${tempInner.substr(
                tempInner.length-1,
                1,
              )}</span>`
              setTimeout(() => (el.innerHTML = tempInner), 1000)
            },
            true,
          )
        })
      } else if (playPattern.exec(word)) {
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

  return (
    <div className='gameroom'>
      <div>
        Joined room #{roomid}{" "}
        <span className={"goBack"} onClick={() => leaveRoom()}>
          Leave
        </span>
      </div>
      <div className='gamelist'>
        <div className='wordlist' ref={wordlistRef}>
          <div className='gamehead'>
            <div>Name</div>
            <div>Word</div>
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
                    ? "You"
                    : playerNames.get(word.id) || word.id}
                  .
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
                  if (words[words.length - 1]?.id !== playerID)
                    if (text != "") sendWord(text)
                }
              }
            }}
            onChange={(e) => setText(e.currentTarget.value)}
          />
          <input
            disabled={
              words[words.length - 1]?.id !== playerID ? false : true
            }
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
      {error && <div>{error}</div>}
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
