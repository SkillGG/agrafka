import React, {
  useState,
  useEffect,
  useRef,
  FormEventHandler,
  FormEvent,
} from "react"
import {
  checkIfPlayerExists,
  fetchFromServer,
  fetchFromServerJSON,
} from "./server"

import { ErrorCode } from "./errors"

import { Language } from "./language"
import { doOnBack } from "./utils"
import { UserData } from "./index"

interface LoginFormElements extends HTMLFormControlsCollection {
  asGuest?: HTMLFormElement
  username?: HTMLFormElement
  password?: HTMLFormElement
}
interface LoginFormElement extends HTMLFormElement {
  readonly elements: LoginFormElements
}

import "./light/login.css"
import "./dark/login.css"
import { isCookie } from "./cookies"

export default function Login({
  language,
  data,
  logged,
  dark,
}: {
  language: Language
  data: any
  dark: boolean
  logged?: UserData
}) {
  const [username, setUsername] = useState<string | false>(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [userID, setUserID] = useState<number>(0)
  const [isPassword, setIsPassword] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const [error, setError] = useState("")
  const [buttonValue, setButtonLabel] = useState(language.next)
  const [fieldLabel, setFieldLabel] = useState<string | JSX.Element>(
    language.inputUsername,
  )

  const [creatingAccount, setCreatingAccount] = useState(false)

  useEffect(() => {
    if (logged && logged.id) {
      setLoggedIn(true)
      setUsername(logged.name)
      setUserID(logged.id)
    }
  }, [logged])

  const checkCookie = () => {
    if (!isCookie("loggedas")) throw window.history.go()
  }

  const logout = async () => {
    checkCookie()
    await fetchFromServer("/logout", {
      method: "POST",
      credentials: "include",
    })
    showInsertUsername()
    setLoggedIn(false)
    data(() => null)
  }

  const showInsertUsername = () => {
    setUsername(false)
    setIsPassword(false)
    setInputValue("")
    setCreatingAccount(false)
    setFieldLabel(language.inputUsername)
    setButtonLabel(language.next)
    setError("")
  }

  const handleSubmit: FormEventHandler<Element> = async (
    ev: FormEvent,
  ) => {
    ev.preventDefault()
    ev.stopPropagation()
    if (!inputValue) {
      // error "Empty field"
    }
    if (!username) {
      // input username
      if (inputValue) {
        let id = null
        if ((id = await checkIfPlayerExists(inputValue))) {
          // show login pass
          setButtonLabel(language.login)
          setUserID(id)
        } else {
          // show create account
          setButtonLabel(language.register)
          setCreatingAccount(true)
        }
        setUsername(inputValue)
        setIsPassword(true)
        if (language.inputPINFor.xfill)
          setFieldLabel(
            language.inputPINFor.xfill({
              value: inputValue,
              onClick: () => {
                showInsertUsername()
              },
            }),
          )
        else
          setFieldLabel(
            language.inputPINFor.fill({ value: inputValue }),
          )
        setInputValue("")
        doOnBack(() => {
          showInsertUsername()
        })
      }
    } else {
      if (creatingAccount) {
        // create account
        if (inputValue.length != 6) {
          // error "too short password"
          setError(language.passTooShort)
          return
        }
        let { status, response } = await fetchFromServer(
          `/create/${username}`,
          { method: "POST", body: inputValue },
        )
        if (status === 200) {
          // user created
          let userData = {
            id: parseInt(await response, 10),
            name: username,
          }
          console.log(userData)
          setError("")
          data(() => userData)
        }
      } else {
        // log into an account
        if (userID) {
          let { status, response } = await fetchFromServerJSON(
            `/user/id/${userID}/login`,
            {
              method: "POST",
              body: inputValue,
              credentials: "include",
            },
          )
          if (status == ErrorCode.NO_USER) {
          } else if (status == ErrorCode.WRONG_PASS) {
            setError(language.wrongPass)
          } else if (status == 200) {
            if (username) {
              window.onpopstate = () => {}
              let userData = { id: userID, name: username }
              setLoggedIn(true)
              setError("")
              data(() => userData)
            }
          }
        } else {
          // error
        }
      }
    }
    inputRef.current?.focus()
  }

  const darkClass = dark ? "dark" : ""

  return (
    <nav className={darkClass}>
      {(!loggedIn && (
        <form onSubmit={handleSubmit}>
          <label htmlFor='inputField'>{fieldLabel}</label>
          <br />
          {creatingAccount && <div>{language.pinInfo}</div>}
          <input
            readOnly={true}
            onFocus={(e) => (e.target.readOnly = false)}
            id='inputField'
            name='inputField'
            type={isPassword ? "password" : "text"}
            value={inputValue}
            ref={inputRef}
            pattern={isPassword ? "\\d{0,6}" : "[a-zA-Z0-9]*"}
            onChange={(e) =>
              (
                e.target.parentElement as HTMLFormElement
              ).checkValidity() && setInputValue(e.target.value)
            }
          />
          <input
            type='submit'
            value={buttonValue}
            onClick={(e) => {
              ;(
                e.currentTarget
                  .previousElementSibling as HTMLInputElement
              ).readOnly = false
            }}
          />
        </form>
      )) || (
        <div className={darkClass}>
          {language.loggedAs.xfill?.({
            value: username || "_ERR_",
            onClick: (ev) => logout(),
          }) ||
            language.loggedAs.fill({ value: username || "_ERR_" })}
        </div>
      )}
      {error && (
        <>
          <span className={`error ${darkClass}`}>{error}</span>
        </>
      )}
    </nav>
  )
}
