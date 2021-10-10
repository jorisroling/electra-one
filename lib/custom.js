const fs = require('fs-extra')
const _ = require('lodash')

const yves = require('yves')
const pkg = require('../package.json')
const debugError = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:error`)

module.exports = (configObj, customFilenames) => {

  let argvCustom = false
  for (let a in process.argv) {
    if (process.argv[a] == '--custom' && (parseInt(a) + 1) < process.argv.length) {
      argvCustom = true
    }
  }

  if (!Array.isArray(customFilenames)) {
    if (!argvCustom && customFilenames) {
      customFilenames = [customFilenames]
    } else {
      customFilenames = []
    }
  }

  for (let a in process.argv) {
    if (process.argv[a] == '--custom' && (parseInt(a) + 1) < process.argv.length) {
      customFilenames.push(process.argv[parseInt(a) + 1])
    }
  }
  customFilenames.forEach( customFilename => {
    if (customFilename && fs.existsSync(customFilename)) {
      try {
        configObj = _.merge(configObj, JSON.parse(fs.readFileSync(customFilename)))
      } catch(e) {
        //
      }
    }
  })

  configObj = _.merge(configObj, {customFilenames} )

  return configObj
}