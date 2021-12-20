const wordRegex = /[a-ząćęłóśźż]+/i

/** @type {Set<string>} */
const WordList = require("./wordlist.js").default

class Word {
  /**
   *
   * @param {number} player
   * @param {string} str
   * @param {number} time
   */
  constructor(player, str, time) {
    /** @type {number} */
    this.playerid = parseInt(player)
    /** @type {string} */
    this.word = str
    /** @type {number} */
    this.time = parseInt(time) || new Date().getTime()
  }
  getStatus() {
    return `${this.playerid}${this.word}${this.time};`
  }
  shallowCorrect() {
    return !!wordRegex.exec(this.word)
  }
  deepCorrect() {
    if (!WordList.ready) return console.error("Not ready yet!"), false
    return WordList.has(this.word.toLowerCase())
  }
}

module.exports.default = Word
