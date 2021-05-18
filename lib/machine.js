const Interface = require('./interface')
const Midi = require('./midi')
const MidiCache = require('./midiCache')


class Machine  {

  constructor(name) {
    this.name = name
    this.interface = new Interface(name)
    //    this.midiCache = new MidiCache()
  }

  handleMidi(midiName, channel = 1) {
    const midiCache = new MidiCache()

    function resetNRPN() {
      midiCache.clearValue(midiName, channel, 6)
      midiCache.clearValue(midiName, channel, 38)
      midiCache.clearValue(midiName, channel, 98)
      midiCache.clearValue(midiName, channel, 99)
      midiCache.clearValue(midiName, channel, 100)
      midiCache.clearValue(midiName, channel, 101)
    }

    return (msg) => {
      //debug('msg %y', msg)
      if (msg._type == 'cc') {
        midiCache.setValue(midiName, msg.channel, msg.controller, msg.value)

        if ((msg.channel + 1) == channel) {
          if ((msg.controller == 98) || (msg.controller == 99)) { // NRPN
          } else if ((msg.controller == 100) || (msg.controller == 101) && msg.value == 127) { // (N)RPN Reset
            if (midiCache.getValue(midiName, msg.channel, 100) == 127 && midiCache.getValue(midiName, msg.channel, 101) == 127) {
              resetNRPN()
              debug('(N)RPN Reset')
            }
          } else if ((msg.controller == 6) || (msg.controller == 38)) {
            const nrpn_lsb = midiCache.getValue(midiName, msg.channel, 98)
            const nrpn_msb = midiCache.getValue(midiName, msg.channel, 99)
            if (Number.isInteger(nrpn_msb) && Number.isInteger(nrpn_msb)) {
              const nrpn = (nrpn_msb << 7) | (nrpn_lsb & 127)
              const path = this.interface.getPathFromNumber('surface', 'nrpn', nrpn)
              if (path) {
                const lsbFirst = this.interface.getElementAttribute(path, 'surface.lsbFirst')
                if (msg.controller == (lsbFirst ? 6 : 38)) {
                  const value_lsb = midiCache.getValue(midiName, msg.channel, lsbFirst ? 6 : 38, 0)
                  const value_msb = midiCache.getValue(midiName, msg.channel, lsbFirst ? 38 : 6)
                  if (Number.isInteger(value_msb) && Number.isInteger(value_lsb)) {
                    const value = (value_msb << 7) | (value_lsb & 127)
                    this.interface.setParameter(path, value, 'surface')
                    debug('NRPN #%y %y = VAL %y INT %y SUR %y EXT %y', nrpn, path, value, this.interface.getParameter(path), this.interface.getParameter(path, 'surface'), this.interface.getParameter(path, 'external'))
                  }
                }
              }
            }
          } else {
            let lastController = msg.controller
            let msbController
            let lsbController
            let value = msg.value
            let path = this.interface.getPathFromNumber('external', 'cc', msg.controller)
            let lsbFirst
            let hiRes
            if (!path && msg.controller >= 32 && msg.controller < 64) {
              path = this.interface.getPathFromNumber('external', 'cc', msg.controller - 32)
            }
            if (path) {
              lsbFirst = this.interface.getElementAttribute(path, 'external.lsbFirst')
              hiRes = this.interface.getElementAttribute(path, 'external.hiRes')
              if (hiRes) {
                if (msg.controller >= 32 && msg.controller < 64) {
                  lastController = msg.controller - (lsbFirst ? 32 : 0)
                  msbController = msg.controller - (lsbFirst ? 0 : 32)
                  lsbController = msg.controller - (lsbFirst ? 32 : 0)
                } else if (msg.controller >= 0 && msg.controller < 32) {
                  lastController = msg.controller + (lsbFirst ? 0 : 32)
                  msbController = msg.controller + (lsbFirst ? 32 : 0)
                  lsbController = msg.controller + (lsbFirst ? 0 : 32)
                }
              } else {
                path = null
              }
            }
            if (msg.controller == lastController) {
              if (path) {
                if (hiRes) {
                  const value_lsb = midiCache.getValue(midiName, msg.channel, lsbController, 0)
                  const value_msb = midiCache.getValue(midiName, msg.channel, msbController)
                  if (Number.isInteger(value_msb) && Number.isInteger(value_lsb)) {
                    value = (value_msb << 7) | (value_lsb & 127)
                  }
                }
                this.interface.setParameter(path, value, 'external')
                debug('CC #%y %y = VAL %y INT %y SUR %y EXT %y', msg.controller, path, value, this.interface.getParameter(path), this.interface.getParameter(path, 'surface'), this.interface.getParameter(path, 'external'))
              } else {
                debug('CC #%y NOT FOUND = VAL %y', msg.controller, msg.value)
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
