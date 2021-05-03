const pkg = require('../package.json')
const debugPrefix = pkg.name
module.exports = {
  debugPrefix,
  debug: Object.prototype.hasOwnProperty.call(process.env,'DEBUG') ? process.env.DEBUG : '',
}
