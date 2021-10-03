const pkg = require('../package.json')
const debugPrefix = pkg.name

const customWrapper = require('../lib/custom')

module.exports = customWrapper({
  debug: Object.prototype.hasOwnProperty.call(process.env, 'DEBUG') ? process.env.DEBUG : `${debugPrefix}:bacara,${debugPrefix}:bacara:error,${debugPrefix}:error:*`,
})
