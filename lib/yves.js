const pkg = require('../package.json')
const yves = require('yves')
const config = require('config')
yves.debugger('Y', { stream: null, sortKeys: true, hideFunctions: true, singleLineMax: 0, obfuscates: [/key/i, /token/i] })
yves.debugger().enable(config.debug)
yves.debugger(pkg.name)

module.exports = yves