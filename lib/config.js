const fs = require('fs-extra')
const _ = require('lodash')



module.exports = (configObj) => {
  let configFilename
  for (let a in process.argv) {
    if (process.argv[a] == '--config' && (parseInt(a)+1)<process.argv.length) {
      configFilename = process.argv[parseInt(a)+1]
    }
  }

  if (configFilename && fs.existsSync(configFilename)) {
    configObj = _.merge(configObj,JSON.parse(fs.readFileSync(configFilename)))
  }
  return configObj
}