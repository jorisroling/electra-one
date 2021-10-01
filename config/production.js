const pkg = require('../package.json')
const debugPrefix = pkg.name
const fs = require('fs-extra')

let configObj = {
  debug: Object.prototype.hasOwnProperty.call(process.env, 'DEBUG') ? process.env.DEBUG : `${debugPrefix}:bacara,${debugPrefix}:bacara:error,${debugPrefix}:error:*`,
}

let configFilename
for (let a in process.argv) {
  if (process.argv[a] == '--config' && (parseInt(a)+1)<process.argv.length) {
    configFilename = process.argv[parseInt(a)+1]
  }
}

if (configFilename && fs.existsSync(configFilename)) {
  configObj = Object.assign({},configObj,JSON.parse(fs.readFileSync(configFilename)))
}

module.exports = configObj

