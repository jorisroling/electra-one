const debug = require('debug')(require('../package.json').name + ':lib:' + (require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':'))

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
      density: (path,value,origin) => {
        debug('Parameter Side Effect Density: Hello World! %y = %y (from %y)',path,value,origin)
        if (origin == 'surface' && value != 100) {
          this.interface.setParameter('killSteps',0)
        }
      },
      killSteps: (path,value,origin) => {
        debug('Parameter Side Effect killSteps: Hello World! %y = %y (from %y)',path,value,origin)
        if (origin == 'surface' && value != 0) {
          this.interface.setParameter('density',100)
        }
      },
      lfo: [
        {
          control(path,value,origin) {
            debug('Parameter Side Effect Control: Hello World! %y = %y (from %y)',path,value,origin)
          },
        },
      ],
    }

    this.actionSideEffects = {
      load: (path,origin) => {
        debug('Action Side Effect load: Hello World! %y (from %y)',path,origin)
        if (origin == 'surface') {
          // do it
        }
      },
    }

    this.interface.on('parameterChange', (path,value,origin) => {
      debug('parameterChange from %y  %y = %y',origin,path,value)
      const parameterSideEffect = _.get(this.parameterSideEffects,path)
      if (typeof parameterSideEffect == 'function') {
        parameterSideEffect(path,value,origin)
      }
    })
    this.interface.on('action', (path,origin) => {
      debug('action from %y  %y',origin,path)
      const actionSideEffect = _.get(this.actionSideEffects,path)
      if (typeof actionSideEffect == 'function') {
        actionSideEffect(path,origin)
      }
    })
  }


  connect(options) {
        debug('connect options %y', options)

    this.interface.connect(options.electra, 'surface')
    this.interface.connect(options.general, 'external')
  }

  readState() {
    const filePath = path.resolve( (process.env.NODE_ENV == 'production') ? untildify(`~/.electra-one/state/${this.name}.json`) : `${__dirname}/../state/${this.name}.json` )
    if (fs.existsSync(filePath)) {
      const state = jsonfile.readFileSync(filePath)

      this.interface.setParameters(state.parameters?state.parameters:state)

      //debug('read %y', this)
      console.trace('JJR')
    }
  }

  writeState() {
    const filePath = path.resolve((process.env.NODE_ENV == 'production') ? untildify(`~/.electra-one/state/${this.name}b.json`) : `${__dirname}/../state/${this.name}b.json`)
    //    debug('w: %y', filePath)
    fs.ensureDirSync(path.dirname(filePath))

    jsonfile.writeFileSync(filePath, {parameters:this.interface.getParameters()}, { flag: 'w', spaces: 2 })
  }


}


module.exports = Machine

const tst = new Machine('acid.v2')
tst.readState()
tst.writeState()

debug('Interface transpose INT: %y', tst.interface.getParameter('transpose'))
debug('Interface transpose SUR: %y', tst.interface.getParameter('transpose', 'surface'))
debug('Interface transpose EXT: %y', tst.interface.getParameter('transpose', 'external'))
debug('Interface transpose MOD: %y', tst.interface.getParameter('transpose', 'modulated'))
debug('Interface transpose ELM: %y', tst.interface.getElement('transpose'))
