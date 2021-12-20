import React, { useEffect, useRef } from "react"
import { useState } from "react"

import Cookies from "universal-cookie"

import ErrorCodes from "../errors"

import "./login.css"
import { fetchFromServer, fetchFromServerJSON } from "./server"

import { Room } from "./gameroom"
import { response } from "express"

interface LoginFormElements extends HTMLFormControlsCollection {
  asGuest?: HTMLFormElement
  username?: HTMLFormElement
  password?: HTMLFormElement
}
interface LoginFormElement extends HTMLFormElement {
  readonly elements: LoginFormElements
}

/**
 * 0- login
 * 1- register
 * 2- password
 * string - logged in
 */
export type loginStates = 0 | 1 | 2 | string

export default function Login({
  data,
}: {
  data: (
    data: () => {
      id: number
      name: string
    } | null,
  ) => void
}) {
  const [username, setUsername] = useState<string | null>(null)
  const [password, setPassword] = useState<string | null>(null)
  const [showPass, setShowPass] = useState<boolean>(false)
  const [state, setLoginState] = useState<loginStates>(0)
  const [userID, setUserID] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const passRef = useRef<HTMLInputElement>(null)
  const loginRef = useRef<HTMLInputElement>(null)

  const resetToDefaults = (
    username: string | null = null,
    showpass: boolean | null = null,
    state: loginStates | null = null,
    userid: number | null = null,
  ) => {
    setUsername(username || null)
    setPassword(null)
    setShowPass(showpass || false)
    setLoginState(state || 0)
    setUserID(userid || null)
    setError(null)
    data(() => null)
  }

  const checkForCookies = async () => {
    if (state === 0) {
      const cookies = new Cookies()
      let c_loggedas: string = cookies.get("loggedas", {
        doNotParse: true,
      })
      if (c_loggedas && /\d+/.exec(c_loggedas)) {
        const { status, response } = await fetchFromServer(
          `/user/id/${c_loggedas}`,
        )

        if (status === 200) {
          const name = await response
          let id = parseInt(c_loggedas)
          setUsername(name)
          setLoginState(name)
          setUserID(id)
          data(() => ({ id, name }))
        }
      }
    }
  }

  useEffect(() => {
    // run only once
    loginRef.current?.focus();
    checkForCookies()
  }, [])

  const checkIfPlayerExists = async (
    name: string,
  ): Promise<false | number> => {
    let call = await fetchFromServer(`/user/name/${name}`)
    if (call.status === 200) return parseInt(await call.response, 10)
    return false
  }

  const createUser = async (
    login: string,
    password: string,
  ): Promise<false | string> => {
    let { status, response: id } = await fetchFromServer(
      `/create/${login}`,
      {
        method: "post",
        body: password,
      },
    )
    if (status === 200) return await id
    console.log(await id)
    setError(
      `Coudn't create user because of a server error! (${await id})`,
    )
    return false
  }

  const logInto = async (id: number, pass: string) => {
    let { status, response } = await fetchFromServerJSON(
      `/user/id/${id}/login`,
      { method: "POST", body: pass, credentials: "include" },
    )
    if (status == ErrorCodes.NO_USER) {
    } else if (status == ErrorCodes.WRONG_PASS) {
      setError((await response).message)
    } else if (status == 200) {
      if (username) {
        setLoginState(username)
        data(() => ({ id, name: username }))
      }
    }
  }

  const logout = async () => {
    await fetchFromServer(`/logout`, {
      credentials: "include",
      method: "post",
    })
    resetToDefaults()
  }

  const doOnBack = (fn: () => void) => {
    window.history.pushState(null, "", window.location.href)
    window.onpopstate = (e) => {
      e.preventDefault()
      window.history.back()
      window.onpopstate = () => {}
      fn()
    }
  }

  const login = async (str: string) => {
    switch (state) {
      case 0:
        // login
        if (!str) return setError("Podaj poprawna nazwe uzytkownika!")
        const id = await checkIfPlayerExists(str)
        if (id) {
          setUsername(str)
          setUserID(id)
          setPassword(null)
          doOnBack(() => setLoginState(0))
          setLoginState(2)
        } else setLoginState(1)
        return
      case 1:
        // register
        if (username) {
          const id = await createUser(username, str)
          if (id) {
            logInto(parseInt(id), str)
          } else {
            console.error("Couldn't create new user!")
          }
        } else return
      case 2:
        // password
        if (userID) await logInto(userID, str)
        return
    }
  }

  const handleUsername = async (
    event: React.FormEvent<LoginFormElement>,
  ) => {
    event.preventDefault()
    setError(null)
    if (event.currentTarget.checkValidity()) login(username || "")
  }

  const handlePassword = (
    event: React.FormEvent<LoginFormElement>,
  ) => {
    event.preventDefault()
    setError(null)
    if (password) login(password)
  }

  switch (state) {
    case 0:
      return (
        <form onSubmit={handleUsername}>
          <label htmlFor='username'>Nazwa: </label>
          <input
            ref={loginRef}
            id='username'
            name='username'
            type='text'
            pattern={"[a-zA-Z0-9]+"}
            value={username || ""}
            onChange={(e) => setUsername(e.target.value || null)}
          />
          <input type='submit' value='Zagraj' />
          {error && (
            <>
              <br />
              <span>{error}</span>
            </>
          )}
        </form>
      )
    case 1:
    case 2:
      // register form
      const log = state === 2
      return (
        <form onSubmit={handlePassword}>
          <span>
            {log
              ? "Zaloguj sie na konto:"
              : "Stworz haslo dla konta:"}
            <span
              onClick={() => setLoginState(0)}
              title={"Zaloguj się na inne konto"}
              style={styles.backText}
            >
              {username}
            </span>
          </span>
          <br />
          <label htmlFor='password'>PIN:</label>
          <input
            id='password'
            ref={passRef}
            name='password'
            type={showPass ? "text" : "password"}
            pattern='\d{6}'
            value={password || ""}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input type='submit' value={"Zaloguj"} />
          <br />
          <span>Pokaż</span>
          <input
            type='checkbox'
            name='showpass'
            id='showpass'
            checked={showPass}
            onChange={(e) => setShowPass(e.target.checked)}
          />
          {error && (
            <>
              <br />
              <span>{error}</span>
            </>
          )}
        </form>
      )
    default:
      // already logged in
      return (
        <div>
          Zalogowano jako{" "}
          <span style={styles.backText} onClick={() => logout()}>
            {state}
          </span>
        </div>
      )
  }
}

const styles = {
  backText: {
    color: "blue",
    textDecoration: "underline",
    cursor: "pointer",
  },
}
