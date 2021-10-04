const fs = require('fs-extra')
const _ = require('lodash')

module.exports = (configObj, customFilename) => {
  for (let a in process.argv) {
    if (process.argv[a] == '--custom' && (parseInt(a) + 1) < process.argv.length) {
      customFilename = process.argv[parseInt(a) + 1]
    }
  }
  if (customFilename && fs.existsSync(customFilename)) {
    configObj = _.merge(configObj, JSON.parse(fs.readFileSync(customFilename)))
  }
  return configObj
}