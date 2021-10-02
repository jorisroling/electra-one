const pkg = require('../package.json')
const debugPrefix = pkg.name

const configWrapper = require('../lib/config')

module.exports = configWrapper({
  debug: Object.prototype.hasOwnProperty.call(process.env, 'DEBUG') ? process.env.DEBUG : `${debugPrefix}:bacara,${debugPrefix}:bacara:error,${debugPrefix}:error:*`,
})
