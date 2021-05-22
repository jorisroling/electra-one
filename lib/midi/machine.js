const debug = require('debug')(require('../../package.json').name + ':lib:midi:' + (require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':'))

const Interface = require('./interface')
const _ = require('lodash')

const fs = require('fs-extra')
const path = require('path')
const untildify = require('untildify')
const jsonfile = require('jsonfile')

class Machine  {

  constructor(name) {
    this.name = name
    this.interface = new Interface(name)

    this.parameterSideEffects = {
    }

    this.actionSideEffects = {
    }

    this.interface.on('parameterChange', (path, value, origin) => {
      //debug('parameterChange from %y  %y = %y',origin,path,value)
      const parameterSideEffect = _.get(this.parameterSideEffects, path)
      if (typeof parameterSideEffect == 'function') {
        parameterSideEffect(path, value, origin)
      }
    })
    this.interface.on('action', (path, origin) => {
      //debug('action from %y  %y',origin,path)
      const actionSideEffect = _.get(this.actionSideEffects, path)
      if (typeof actionSideEffect == 'function') {
        actionSideEffect(path, origin)
      }
    })
  }

  static getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max + 1))
  }

  /*  connect(options) {
    debug('connect options %y', options)

    this.interface.connect(options.electra, 'surface')
    this.interface.connect(options.general, 'external')
  }
*/
  connect(portName, kind) {
    debug('connect %y as %y', portName, kind)
    this.interface.connect(portName, kind)
  }

  readState() {
    const filePath = path.resolve( (process.env.NODE_ENV == 'production') ? untildify(`~/.electra-one/state/${this.name}.json`) : `${__dirname}/../../state/${this.name}.json` )
    if (fs.existsSync(filePath)) {
      const state = jsonfile.readFileSync(filePath)
      this.interface.setParameters(state.parameters ? state.parameters : state)
    }
  }

  writeState() {
    const filePath = path.resolve((process.env.NODE_ENV == 'production') ? untildify(`~/.electra-one/state/${this.name}b.json`) : `${__dirname}/../../state/${this.name}b.json`)
    fs.ensureDirSync(path.dirname(filePath))
    jsonfile.writeFileSync(filePath, {parameters:this.interface.getParameters()}, { flag: 'w', spaces: 2 })
  }


}


module.exports = Machine

/*const tst = new Machine('acid.v2')
tst.readState()
tst.writeState()

debug('Interface transpose INT: %y', tst.interface.getParameter('transpose'))
debug('Interface transpose SUR: %y', tst.interface.getParameter('transpose', 'surface'))
debug('Interface transpose EXT: %y', tst.interface.getParameter('transpose', 'external'))
debug('Interface transpose MOD: %y', tst.interface.getParameter('transpose', 'modulated'))
debug('Interface transpose ELM: %y', tst.interface.getElement('transpose'))
*/