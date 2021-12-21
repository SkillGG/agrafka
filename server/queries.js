const Queries = {
  getPlayerInARoom:
    "select id from room left join users on users.id = room.player_id where room.id = ?",
  getPlayerID: "select id from users where name=?",
  getPlayerName: "select name from users where id=?",
  getPlayerInfo: "select id, pin from users where id=?",
  getGuest: "select ifnull(max(id),0) as num from guests",
  getRoomList:
    "select roomid, gamestate, maxplayers, lang, creator from games where gamestate not like '%~'",
  updateRoom: `update games set gamestate = ? where gamestate not like "%~" and roomid=?;`,
  getNumberOfPlayersWithUsername:"select count(name) as num from users where name = ?"
}

module.exports.default = Queries
