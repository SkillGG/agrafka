const fs = require("fs")
/** @type {Set<string>[]} */
let wordlist = [];
try {
  const ENDic = fs.readFileSync("./server/dic/EN.bak", {
    encoding: "utf-8",
  })
  wordlist.push(new Set(ENDic.split("\n")))
  console.log("English loaded")
  const PLDic = fs.readFileSync("./server/dic/PL.bak", {
    encoding: "utf-8",
  })
  wordlist.push(new Set(PLDic.split("\n")))
  console.log("Polish loaded")
  console.log("Ready")
  wordlist.ready = true
} catch (e) {
  console.error(e)
}
module.exports.default = wordlist
