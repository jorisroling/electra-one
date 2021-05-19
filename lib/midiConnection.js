const debug = require('debug')(require('../package.json').name + ':lib:' + (require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':'))

const Midi = require('./midi')
const MidiCache = require('./midiCache')

class MidiConnection {
  constructor(portName, kind, channel, incomming, outgoing, interfce) {
    this.portName = Midi.normalisePortName(portName)
    this.channel = channel
    this.kind = kind
    this.incomming = incomming
    this.outgoing = outgoing
    this.interface = interfce

    if (incomming) {
      const midiInput = Midi.input(this.portName, true, true)
      if (midiInput) {
        midiInput.on('message', this.handleMidi() )
      }
    }

  }

  sendParameter(path, portName, channel, kind) {
    const value = this.interface.getParameter(path, kind)
    const type = this.interface.getElementAttribute(path, `${kind}.type`)
    const number = this.interface.getElementAttribute(path, `${kind}.number`)
    if (type) {
      if (type == 'nrpn') {
        Midi.send(portName, type, {channel, number, value})
      }
      if (type == 'cc') {
        Midi.send(portName, type, {channel, controller:number, value})
      }
    }
    debug('sendParameter  path %y  portName %y  channel %y  kind %y  value %y  type %y', path, portName, channel, kind, value, type)
  }


  handleMidi() {
    const midiCache = new MidiCache()

    const resetNRPN = () => {
      midiCache.clearValue(this.portName, this.channel, 'cc', 6)
      midiCache.clearValue(this.portName, this.channel, 'cc', 38)
      midiCache.clearValue(this.portName, this.channel, 'cc', 98)
      midiCache.clearValue(this.portName, this.channel, 'cc', 99)
      midiCache.clearValue(this.portName, this.channel, 'cc', 100)
      midiCache.clearValue(this.portName, this.channel, 'cc', 101)
    }

    return (msg) => {
      //debug('msg %y', msg)
      if (msg._type == 'cc') {
        midiCache.setValue(this.portName, msg.channel, 'cc', msg.controller, msg.value)

        if (msg.channel == this.channel) {
          if ((msg.controller == 98) || (msg.controller == 99)) { // NRPN
            // Just have these values in the midiCache
          } else if ((msg.controller == 100) || (msg.controller == 101) && msg.value == 127) { // (N)RPN Reset
            if (midiCache.getValue(this.portName, msg.channel, 'cc', 100) == 127 && midiCache.getValue(this.portName, msg.channel, 'cc', 101) == 127) {
              resetNRPN()
              /*              debug('(N)RPN Reset')*/
            }
          } else if ((msg.controller == 6) || (msg.controller == 38)) {
            const nrpn_lsb = midiCache.getValue(this.portName, msg.channel, 'cc', 98)
            const nrpn_msb = midiCache.getValue(this.portName, msg.channel, 'cc', 99)
            if (Number.isInteger(nrpn_msb) && Number.isInteger(nrpn_msb)) {
              const nrpn = (nrpn_msb << 7) | (nrpn_lsb & 127)
              const path = this.interface.getPathFromNumber(this.kind, 'nrpn', nrpn)
              if (path) {
                const lsbFirst = this.interface.getElementAttribute(path, `${this.kind}.lsbFirst`)
                if (msg.controller == (lsbFirst ? 6 : 38)) {
                  const value_lsb = midiCache.getValue(this.portName, msg.channel, 'cc', lsbFirst ? 6 : 38, 0)
                  const value_msb = midiCache.getValue(this.portName, msg.channel, 'cc', lsbFirst ? 38 : 6)
                  if (Number.isInteger(value_msb) && Number.isInteger(value_lsb)) {
                    const value = (value_msb << 7) | (value_lsb & 127)
                    if (this.interface.setParameter(path, value, this.kind)) {
                      debug('%s %s NRPN #%y %y = VAL %y INT %y SUR %y EXT %y', this.portName, this.kind, nrpn, path, value, this.interface.getParameter(path), this.interface.getParameter(path, this.kind), this.interface.getParameter(path, 'external'))
                    }
                  }
                }
              }
            }
          } else {
            let lastController = msg.controller
            let msbController
            let lsbController
            let value = msg.value
            let path = this.interface.getPathFromNumber(this.kind, 'cc', msg.controller)
            let lsbFirst
            let hiRes
            if (!path && msg.controller >= 32 && msg.controller < 64) {
              path = this.interface.getPathFromNumber(this.kind, 'cc', msg.controller - 32)
            }
            if (path) {
              lsbFirst = this.interface.getElementAttribute(path, `${this.kind}.lsbFirst`)
              hiRes = this.interface.getElementAttribute(path, `${this.kind}.hiRes`)
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
                //              } else {
                //                path = null
              }
            }
            if (msg.controller == lastController) {
              //    debug('HI %y == %y %s',msg.controller , lastController, path)
              if (path) {
                if (hiRes) {
                  const value_lsb = midiCache.getValue(this.portName, msg.channel, 'cc', lsbController, 0)
                  const value_msb = midiCache.getValue(this.portName, msg.channel, 'cc', msbController)
                  if (Number.isInteger(value_msb) && Number.isInteger(value_lsb)) {
                    value = (value_msb << 7) | (value_lsb & 127)
                  }
                }
                if (this.interface.setParameter(path, value, this.kind)) {
                  debug('%s %s CC #%y %y = VAL %y INT %y SUR %y EXT %y', this.portName, this.kind, msg.controller, path, value, this.interface.getParameter(path), this.interface.getParameter(path, this.kind), this.interface.getParameter(path, 'external'))
                }
              } else {
                debug('%s %s CC #%y NOT FOUND = VAL %y', this.portName, this.kind, msg.controller, msg.value)
              }
            }
          }
        }
      }
    }
  }


}

module.exports = MidiConnection