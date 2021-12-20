export const fetchFromServer = async (
  path: string,
  options: RequestInit | undefined = undefined,
): Promise<{ status: number; response: Promise<string> }> => {
  return await fetch(`http://localhost:3002${path}`, options).then(
    (r) => ({ status: r.status, response: r.text() }),
  )
}

export const fetchFromServerJSON = async (
  path: string,
  options: RequestInit | undefined = undefined,
): Promise<{ status: number; response: Promise<any> }> => {
  return await fetch(`http://localhost:3002${path}`, options).then(
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
