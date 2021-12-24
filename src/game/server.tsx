
export const serverdomain = "http://localhost:3002"
//export const serverdomain = "https://shiriserver.skillgg.repl.co"

export const fetchFromServer = async (
  path: string,
  options: RequestInit | undefined = undefined,
): Promise<{ status: number; response: Promise<string> }> => {
  const opts:RequestInit = {...options, cache: "no-cache"};
  return await fetch(`${serverdomain}${path}`, opts).then(
    (r) => ({ status: r.status, response: r.text() }),
  )
}

export const fetchFromServerJSON = async (
  path: string,
  options: RequestInit | undefined = undefined,
): Promise<{ status: number; response: Promise<any> }> => {
  const opts:RequestInit = {...options, cache: "no-cache"};
  return await fetch(`${serverdomain}${path}`, opts).then(
    (r) => ({ status: r.status, response: r.json() }),
  )
}

export const checkIfPlayerExists = async (
  name: string,
): Promise<false | number> => {
  let call = await fetchFromServer(`/user/name/${name}`)
  if (call.status === 200) return parseInt(await call.response, 10)
  return false
}
