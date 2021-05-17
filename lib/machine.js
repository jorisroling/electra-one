const Interface = require(`./interface`)
const Midi = require('./midi')
const _ = require('lodash')

class Machine  {

  constructor(name) {
    this.name = name
    this.interface = new Interface(name)
    this.midiCache = {}
  }

  handleMidi(midiName, channel=1) {

    if (!this.midiCache[midiName]) {
      this.midiCache[midiName] = {}
    }

    return (msg) => {
      debug('msg %y',msg)
      if (msg._type == 'cc') {
        _.set(this.midiCache[midiName], `channel_${_.padStart(msg.channel + 1, 2, '0')}.controller_${_.padStart(msg.controller, 3, '0')}`, msg.value)

        if ((msg.channel + 1) == channel) {
          if ((msg.controller == 6) || (msg.controller == 38)) {
            const msb = _.get(this.midiCache, `${midiName}.channel_${_.padStart(msg.channel + 1, 2, '0')}.controller_099`,0)
            const lsb = _.get(this.midiCache, `${midiName}.channel_${_.padStart(msg.channel + 1, 2, '0')}.controller_098`,0)

            debug('NRPN %y',msb<<7 | lsb)
          }
        }
      }
    }
  }

  connect(midiInputName) { // electra-one-2
    const midiInput = Midi.input(midiInputName, true, true)
    if (midiInput) {
      midiInput.on('message', this.handleMidi(midiInputName) )
    }
  }
}


module.exports = Machine

const tst = new Machine('acid.v2')
tst.interface.read()
tst.interface.write()

debug('Interface transpose INT: %y', tst.interface.getParameter('transpose'))
debug('Interface transpose SUR: %y', tst.interface.getParameter('transpose', 'surface'))
debug('Interface transpose EXT: %y', tst.interface.getParameter('transpose', 'external'))
debug('Interface transpose MOD: %y', tst.interface.getParameter('transpose', 'modulated'))
debug('Interface transpose ELM: %y', tst.interface.getElement('transpose'))
