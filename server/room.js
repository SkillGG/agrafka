const Word = require("./word").default

class Room {
  /**
   *
   * @param {*} id
   * @param {*} players
   * @param {Word[]} data
   * @param {*} maxPlayers
   */
  constructor(id, players, data, maxPlayers) {
    this.players = new Set()
    this.data = data || []
    this.id = parseInt(id, 10)
    this.sse = new Map()
    this.maxPlayers = maxPlayers
    this.sendEvent = null
    /**
     * @type {Map<number, function>}
     */
    this.sendEvents = new Map()
  }
  getNumberOfPlayersLoggedIn() {
    return this.players.size
  }
  assignSend(id, callback) {
    console.log(
      "Changing send function for player:",
      id,
      "\n",
      callback.toString(),
    )
    this.sendEvents.set(id, callback)
  }
  addPlayer(id) {
    const userid = parseInt(id, 10)
    if (this.players.size >= this.maxPlayers) return false
    else {
      this.players.add(userid)
      return true
    }
  }
  removePlayer(id) {
    const userid = parseInt(id, 10)
    this.players.delete(userid)
    this.sendEvents.set(userid, () => {
      console.warn(`player ${userid} left`)
    })
    return !this.players.has(userid)
  }
  registerWord(playerid, str, time) {
    if (playerid && str) {
      this.data.push(new Word(playerid, str, time))
    }
  }
  getState() {
    const worddata = this.data.slice(1).reduce((prev, data) => {
      return prev + data.getStatus()
    }, "")
    return `${worddata || ""}${this.data[0] ? "~" : ""}`
  }
}

/**
 *
 * @param {string} state
 * @returns
 */
Room.parseState = (state) => {
  let ret = [!!/.*~$/.exec(state)]
  let regx = state.matchAll(
    /(?<player>\d+?)(?<word>[a-ząćęółńśżź]+)(?<time>\d+?);/gi,
  )
  for (const nxt of regx) {
    const { player, word, time } = nxt.groups
    ret.push(new Word(player, word, time))
  }
  return ret
}

module.exports.default = Room
