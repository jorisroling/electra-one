const path = require('path')
const glob = require('glob')

const settings = {}

const settingFiles = glob.sync(path.join(__dirname,'..','settings') + '/*.js', {})
for (let f = 0; f < settingFiles.length; f++) {
  const name = path.basename(settingFiles[f], '.js')
  settings[name] = require(settingFiles[f])
}

module.exports = settings