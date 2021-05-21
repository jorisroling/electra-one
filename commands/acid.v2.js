const debug = require('debug')(require('../package.json').name + ':command:' + require('path').basename(__filename, '.js'))


const Acid = require('../lib/acid')

const Midi = require('../lib/midi/midi')

const Machine = require('../lib/midi/machine')

class AcidMachine extends Machine {
  constructor(name) {
    super(name)

    this.actionSideEffects = {
      load: (path,origin) => {
        debug('Action Side Effect load: Hello World! %y (from %y)',path,origin)
        if (origin == 'surface') {
          // do it
        }
      },
    }

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
  }
}


function acidSequencer(name, sub, options) {

//  Midi.setupVirtualPorts(config.acid.virtual)

  const machine = new AcidMachine('acid.v2')
  machine.readState()
  machine.writeState()

  machine.connect(options.electra, 'surface')
  machine.connect(options.general, 'external')
  machine.connect(options.clock, 'clock')
}

module.exports = {
  name: 'acid.v2',
  description: 'Acid Sequencer',
  examples: [
    {usage:'electra-one acid', description:'Starts acid sequencer'},
  ],
  handler: acidSequencer,
}



