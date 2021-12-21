const fs = require("fs")
/** @type {Set<string>} */
let wordlist;
try {
  const data = fs.readFileSync("./server/dic/EN.bak", {
    encoding: "utf-8",
  })
  wordlist = new Set(data.split("\n"))
  wordlist.ready = false
  console.log("Ready")
  wordlist.ready = true
} catch (e) {
  console.error(e)
}
module.exports.default = wordlist
