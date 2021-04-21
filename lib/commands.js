const path = require('path')
const glob = require('glob')

const commands = {}
const commandFiles = glob.sync(path.join(__dirname,'..','commands') + '/*.js', {})
for (let f = 0; f < commandFiles.length; f++) {
  const name = path.basename(commandFiles[f], '.js')
  commands[name] = require(commandFiles[f])
}

module.exports = commands
