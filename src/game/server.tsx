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