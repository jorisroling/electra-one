const debug = require('yves').debugger(require('../package.json').name + ':lib:' + (require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':'))

const EventEmitter = require('events')

/*class Bacara  extends EventEmitter {
  constructor(name) {
    super()
  }


  trigger(name, origin) {
    return this.emit('action', path, origin)
  }


}

*/

module.exports = {
  event: new EventEmitter()
}


