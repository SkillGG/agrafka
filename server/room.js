const Word = require("./word").default

class Room {
  /**
   *
   * @param {*} id
   * @param {*} players
   * @param {Word[]} data
   * @param {*} maxPlayers
   * @param {Map, number} points
   */
  constructor(id, players, data, maxPlayers, pts, lang, creator) {
    this.players = new Set()
    this.data = data || []
    /**@type {Map<number, number>} */
    this.points = pts || new Map()
    this.id = parseInt(id, 10)
    this.sse = new Map()
    this.maxPlayers = maxPlayers
    this.sendEvent = null
    this.language = lang || 0
    this.creator = creator || 1
    /**
     * @type {Map<number, function>}
     */
    this.sendEvents = new Map()
  }
  shallowCorrect(word) {
    return word.shallowCorrect(this.language)
  }
  /**
   *
   * @param {Word} word
   */
  checkDictionary(word) {
    return word.deepCorrect(this.language)
  }
  clearBadPlayers() {
    if (this.players.has(NaN)) this.players.delete(NaN)
    if (this.sse.has(NaN))
      this.sse.get(NaN)({ type: "leave" }), this.sse.delete(NaN)
  }
  addPoints(id, num) {
    if (!id) return
    console.log("Point manip", id, num, this.points)
    if (num < 0) this.points.set(id, (this.points.get(id) || 0) - num)
    this.clearBadPlayers()
  }
  checkForWord(word) {
    this.clearBadPlayers()
    for (let i = 0; i < this.data.length; i++) {
      if (word === this.data[i]) return true
    }
    return false
  }
  getNumberOfPlayersLoggedIn() {
    return this.players.size
  }
  assignSend(id, callback) {
    this.clearBadPlayers()
    if (!id) return
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
      if (!userid) return false
      this.players.add(userid)
      if (!this.points.has(userid)) {
        this.points.set(userid, 0)
      }
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
    this.clearBadPlayers()
    if (playerid && str) {
      this.data.push(new Word(playerid, str, time))
    }
  }
  getState() {
    const worddata = this.data.slice(1).reduce((prev, data) => {
      return prev + data.getStatus()
    }, "")
    const pointdata = [...this.points].reduce((prev, next) => {
      return (
        prev + (next[1] > 0 ? `${next[0]}${"-".repeat(next[1])}` : "")
      )
    }, "")
    return `${worddata || ""}${pointdata}${this.data[0] ? "~" : ""}`
  }
}

/**
 *
 * @param {string} state
 * @returns
 */
Room.parseState = (state) => {
  /**@type {[boolean, Array<Array<number>>, ...Word[]]} */
  let ret = [!!/.*~$/.exec(state)]
  let ptsregx = state.matchAll(/(?<id>\d+)(?<pts>\-+)/gi)
  ret[1] = []
  for (const rgp of ptsregx) {
    const { id, pts } = rgp.groups
    ret[1].push([parseInt(id, 10), pts.length])
  }
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
