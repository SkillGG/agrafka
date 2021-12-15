class Word {
  constructor(player, str, time) {
    this.playerid = parseInt(player)
    this.word = str
    this.time = parseInt(time) || new Date().getTime()
  }
  getStatus() {
    return `${this.playerid}${this.word}${this.time};`
  }
}

module.exports.default = Word
