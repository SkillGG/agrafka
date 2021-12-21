const Room = require("./room").default
const Word = require("./word").default
const Queries = require("./queries").default

class Hub {
  constructor() {
    /**
     * @type {Array<Room>}
     */
    this.rooms = []
    this.roomid = 0
  }
  addRoom(roomid) {
    let newRoom = new Room(parseInt(roomid, 10) || this.roomid++)
    this.rooms.push(newRoom)
    return newRoom
  }
  /**
   *
   * @param {int} id
   * @returns {Room}
   */
  getRoom(id) {
    return this.rooms.find((r) => r.id === parseInt(id, 10))
  }
  /**
   *
   * @param {number} playerid
   */
  whereIs(playerid) {
    playerid = parseInt(playerid)
    if (!playerid) return null
    const foundRoom = this.rooms.find((room) => {
      return room.players.has(playerid)
    })
    if (foundRoom) return foundRoom.id
    else return null
  }

  async saveRoom(roomid, update) {
    const room = this.rooms.find((room) => room.id === roomid)
    if (room) {
      await update(room.id, room.getState())
    }
  }

  async saveRooms(update) {
    for (const room of this.rooms) {
      await update(room.id, room.getState())
    }
  }

  /**
   *
   * @param {mysql.Pool} db
   */
  async init(db) {
    let dbPromise = db.promise()
    const [rows] = await dbPromise.execute(Queries.getRoomList)
    if (rows && Array.isArray(rows)) {
      rows.forEach((e) => {
        if (!this.rooms.find((r) => r.id === parseInt(e.roomid)))
          this.addRoom(e.roomid)
        const parsedData = Room.parseState(e.gamestate)
        console.log("parsed", parsedData, "\n\n")
        this.getRoom(e.roomid).data = [
          parsedData[0],
          ...parsedData.filter((a, i) => i > 1),
        ]
        this.getRoom(e.roomid).points = new Map(parsedData[1])
        this.getRoom(e.roomid).maxPlayers = parseInt(e.maxplayers, 10)
        this.getRoom(e.roomid).language = parseInt(e.lang || 0, 10)
        this.getRoom(e.roomid).creator = parseInt(e.creator || 1, 10)
      })
    }
    this.rooms.forEach((e) => e.clearBadPlayers())
  }
}

module.exports = Hub
