import Cookies, { CookieGetOptions } from "universal-cookie"

export const isCookie = (
  name: string,
  options?: CookieGetOptions,
) => {
  return !!getCookie(name, options)
}

export const getCookie = (
  name: string,
  options: CookieGetOptions | null = null,
  validate: ((value: any) => boolean) | null = null,
) => {
  const cookies = new Cookies()
  let cookie = cookies.get(name, options || { doNotParse: true })
  return validate?.(cookie) || cookie
}

export const getCookieAsString = (
  name: string,
  options?: CookieGetOptions,
) => {
  return getCookie(name, { ...options, doNotParse: true })
}
