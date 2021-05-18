const Interface = require('./interface')
const Midi = require('./midi')
const _ = require('lodash')

class Machine  {

  constructor(name) {
    this.name = name
    this.interface = new Interface(name)
    this.midiCache = {}
  }

  handleMidi(midiName, channel = 1) {

    if (!this.midiCache[midiName]) {
      this.midiCache[midiName] = {}
    }

    return (msg) => {
      //debug('msg %y', msg)
      if (msg._type == 'cc') {
        _.set(this.midiCache[midiName], `channel_${_.padStart(msg.channel + 1, 2, '0')}.controller_${_.padStart(msg.controller, 3, '0')}`, msg.value)

        if ((msg.channel + 1) == channel) {
          if (((msg.controller == 100) || (msg.controller == 101)) /* (N)RPN Reset */
            && _.get(this.midiCache, `${midiName}.channel_${_.padStart(msg.channel + 1, 2, '0')}.controller_100`, 0) == 127
            && _.get(this.midiCache, `${midiName}.channel_${_.padStart(msg.channel + 1, 2, '0')}.controller_101`, 0) == 127) {
            _.unset(this.midiCache[midiName], `channel_${_.padStart(msg.channel + 1, 2, '0')}.controller_006`)
            _.unset(this.midiCache[midiName], `channel_${_.padStart(msg.channel + 1, 2, '0')}.controller_038`)
            _.unset(this.midiCache[midiName], `channel_${_.padStart(msg.channel + 1, 2, '0')}.controller_098`)
            _.unset(this.midiCache[midiName], `channel_${_.padStart(msg.channel + 1, 2, '0')}.controller_099`)
            _.unset(this.midiCache[midiName], `channel_${_.padStart(msg.channel + 1, 2, '0')}.controller_100`)
            _.unset(this.midiCache[midiName], `channel_${_.padStart(msg.channel + 1, 2, '0')}.controller_101`)
            debug('(N)RPN Reset')
          }
          if ((msg.controller == 6) || (msg.controller == 38)) {
            const nrpn_msb = _.get(this.midiCache, `${midiName}.channel_${_.padStart(msg.channel + 1, 2, '0')}.controller_099`)
            const nrpn_lsb = _.get(this.midiCache, `${midiName}.channel_${_.padStart(msg.channel + 1, 2, '0')}.controller_098`)
            if (Number.isInteger(nrpn_msb) && Number.isInteger(nrpn_msb)) {
              const nrpn = (nrpn_msb << 7) | (nrpn_lsb & 127)
              const path = _.get(this.interface.map, `surface.nrpn.#${nrpn}`)
              if (path) {
                const value_msb = _.get(this.midiCache, `${midiName}.channel_${_.padStart(msg.channel + 1, 2, '0')}.controller_006`)
                const value_lsb = _.get(this.midiCache, `${midiName}.channel_${_.padStart(msg.channel + 1, 2, '0')}.controller_038`, 0)
                if (Number.isInteger(value_msb) && Number.isInteger(value_lsb)) {
                  const value = (value_lsb << 7) | (value_msb & 127)
                  this.interface.setParameter(path, value, 'surface')
                  debug('NRPN #%y %y = VAL %y INT %y SUR %y EXT %y', nrpn, path, value, this.interface.getParameter(path), this.interface.getParameter(path, 'surface'), this.interface.getParameter(path, 'external'))
                }
              }
            }
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
