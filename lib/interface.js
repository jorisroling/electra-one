const _ = require('lodash')
const deepEqual = require('deep-equal')
const fs = require('fs-extra')
const path = require('path')
const untildify = require('untildify')
const jsonfile = require('jsonfile')

const Acid = require('../lib/acid')
const deepSortObject = require('deep-sort-object')

const Midi = require('./midi')
const MidiCache = require('./midiCache')

const remap = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2

class Interface  {
  constructor(name) {
    this.name = name
    this.interface = require(`../interfaces/${name}`)
    this.mapMIDI()
    this.reset()
    this.connections = []
  }

  mapMIDI() {
    const mapSelective = (template, path = '') => {
      if (template) {
        if (Interface.isEdge(template)) {
          ['surface', 'external'].forEach( origin => {
            if (template[origin]) {
              if ((template[origin].type == 'nrpn' || template[origin].type == 'cc') && Number.isInteger(template[origin].number)) {
                const mapPath = `${origin}.${template[origin].type}.#${template[origin].number}`
                if (_.get(this.map, mapPath)) {
                  debug('Warning! Double assignment of elements %s -> %y %y', this.name, mapPath, template[origin])
                }
                _.set(this.map, mapPath, path)
              } else {
                debug('What? %y', template[origin])
              }
            }
          })
        } else {
          const templateKeys = Object.keys(template)
          for (const templateKey of templateKeys) {
            if (_.isPlainObject(template[templateKey]) || Array.isArray(template[templateKey])) {
              mapSelective(template[templateKey], `${path ? path + '.' : ''}${templateKey}`)
            }
          }
        }
      }
    }

    this.map = {}
    mapSelective(this.interface.elements)
    debug('map %y', this.map)
  }

  getPathFromNumber(origin, type, number) {
    const mapPath = `${origin}.${type}.#${number}`
    const result = _.get(this.map, mapPath)
    /*    debug('getPathFromNumber %y = %y',mapPath,result)*/
    return result
  }

  reset() {
    const resetSelective = (template, path = '') => {
      if (template) {
        if (Interface.isEdge(template)) {
          _.set(this.parameters, path, _.get(template, 'default', 0) )
        } else {
          const templateKeys = Object.keys(template)
          for (const templateKey of templateKeys) {
            if (_.isPlainObject(template[templateKey]) || Array.isArray(template[templateKey])) {
              resetSelective(template[templateKey], `${path ? path + '.' : ''}${templateKey}`)
            }
          }
        }
      }
    }

    this.parameters = {}
    resetSelective(this.interface.elements)
  }

  static isEdge(node) {
    return _.isPlainObject(node) && (node.surface || node.external) && node.type && node.name
  }

  getElement(path) {
    return _.get(this.interface.elements, path)
  }

  getElementAttribute(path, attribute, deflt) {
    return _.get(this.interface.elements, `${path}.${attribute}`, deflt)
  }

  getParameter(path, kind = 'internal') {  // internal, surface, external, modulated
    let result = _.get(this.parameters, path, this.getElementAttribute(path, 'default', 0) )

    if (kind == 'surface' || kind == 'external') {
      if (!this.getElementAttribute(path, kind)) {
        return null
      }
      let x1 = this.getElementAttribute(path, 'min', this.getElementAttribute(path, `${kind}.min`, 0))
      let y1 = this.getElementAttribute(path, 'max', this.getElementAttribute(path, `${kind}.max`, 127))
      const x2 = this.getElementAttribute(path, `${kind}.min`, this.getElementAttribute(path, 'min', 0))
      const y2 = this.getElementAttribute(path, `${kind}.max`, this.getElementAttribute(path, 'max', 127))
      if (((y1 - x1) % 2) != ((y2 - x2) % 2) ) {
        const value = remap(result, x1, y1, x2, y2)
        if (value < (y2 - x2)) {
          y1++
        } else {
          x1--
        }
      }
      result = remap(result, x1, y1, x2, y2)
      return Math.round(result)
    }

    const precision = this.getElementAttribute(path, 'precision', 2)
    if (Number.isInteger(precision)) {
      result = Number.parseFloat(Number.parseFloat(result).toFixed(precision))
    }
    return result
  }

  setParameter(path, value, origin = 'internal') {
    //    debug('JJR')
    if (typeof value != 'number') {
      value = this.getElementAttribute(path, 'default', 0)
    }
    /*    debug('setParameter %y %y %y', path, value, origin)*/
    if (origin == 'surface' || origin == 'external') {
      //      if (this.getElementAttribute(path, `${origin}.lsbFirst`)) {
      //        value = ((value>>7)&127) | ((value&127)<<7)
      //      }
      let x1 = this.getElementAttribute(path, `${origin}.min`, this.getElementAttribute(path, 'min', 0))
      let y1 = this.getElementAttribute(path, `${origin}.max`, this.getElementAttribute(path, 'max', 127))
      const x2 = this.getElementAttribute(path, 'min', this.getElementAttribute(path, `${origin}.min`, 0))
      const y2 = this.getElementAttribute(path, 'max', this.getElementAttribute(path, `${origin}.max`, 127))
      if (((y1 - x1) % 2) != ((y2 - x2) % 2) ) {
        if (value < (y1 - x1)) {
          y1--
        } else {
          x1++
        }
      }
      value = remap(value, x1, y1, x2, y2)
    }
    if ( _.set(this.parameters, path) !== value ) {
      _.set(this.parameters, path, value)

      for (let c in this.connections) {
        if (this.connections[c].kind != origin) {
          this.sendParameter(path, this.connections[c].portName, this.connections[c].channel, this.connections[c].kind)
        }
      }
      return true // CHANGED
    }
    return false // UN-CHANGED
  }

  sendParameter(path, portName, channel, kind) {
    const value = this.getParameter(path, kind)
    const type = this.getElementAttribute(path, `${kind}.type`)
    const number = this.getElementAttribute(path, `${kind}.number`)
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

  read() {
    const filePath = path.resolve( (process.env.NODE_ENV == 'production') ? untildify(`~/.electra-one/state/${this.name}.json`) : `${__dirname}/../state/${this.name}.json` )
    if (fs.existsSync(filePath)) {
      const state = jsonfile.readFileSync(filePath)

      const copySelective = (source, template, path = '') => {
        if (template) {
          if (Interface.isEdge(template)) {
            //            _.set(this, `parameters.${path}`, typeof source === 'number' ? source : _.get(template, 'default', 0) )
            this.setParameter(path, source)
          } else {
            const templateKeys = Object.keys(template)
            for (const templateKey of templateKeys) {
              if (_.isPlainObject(template[templateKey]) || Array.isArray(template[templateKey])) {
                copySelective(_.get(source, templateKey), template[templateKey], `${path ? path + '.' : ''}${templateKey}`)
              } else {
                debug('rogue element @ %y', path)
              }
            }
          }
        }
      }

      this.parameters = {}
      copySelective(state, this.interface.elements)
      //debug('read %y', this)
    }
  }

  write(quiet = false) {
    const filePath = path.resolve((process.env.NODE_ENV == 'production') ? untildify(`~/.electra-one/state/${this.name}b.json`) : `${__dirname}/../state/${this.name}b.json`)
    //    debug('w: %y', filePath)
    fs.ensureDirSync(path.dirname(filePath))

    jsonfile.writeFileSync(filePath, deepSortObject(this.parameters), { flag: 'w', spaces: 2 })
    if (!quiet) {
      Acid.table(this)
    }
  }

  handleMidi(portName, kind, channel = 1) {
    const midiCache = new MidiCache()

    function resetNRPN() {
      midiCache.clearValue(portName, channel, 'cc', 6)
      midiCache.clearValue(portName, channel, 'cc', 38)
      midiCache.clearValue(portName, channel, 'cc', 98)
      midiCache.clearValue(portName, channel, 'cc', 99)
      midiCache.clearValue(portName, channel, 'cc', 100)
      midiCache.clearValue(portName, channel, 'cc', 101)
    }

    return (msg) => {
      //      debug('msg %y', msg)
      if (msg._type == 'cc') {
        midiCache.setValue(portName, msg.channel, 'cc', msg.controller, msg.value)

        if ((msg.channel + 1) == channel) {
          if ((msg.controller == 98) || (msg.controller == 99)) { // NRPN
            // Just have these values in the midiCache
          } else if ((msg.controller == 100) || (msg.controller == 101) && msg.value == 127) { // (N)RPN Reset
            if (midiCache.getValue(portName, msg.channel, 'cc', 100) == 127 && midiCache.getValue(portName, msg.channel, 'cc', 101) == 127) {
              resetNRPN()
              /*              debug('(N)RPN Reset')*/
            }
          } else if ((msg.controller == 6) || (msg.controller == 38)) {
            const nrpn_lsb = midiCache.getValue(portName, msg.channel, 'cc', 98)
            const nrpn_msb = midiCache.getValue(portName, msg.channel, 'cc', 99)
            if (Number.isInteger(nrpn_msb) && Number.isInteger(nrpn_msb)) {
              const nrpn = (nrpn_msb << 7) | (nrpn_lsb & 127)
              const path = this.getPathFromNumber(kind, 'nrpn', nrpn)
              if (path) {
                const lsbFirst = this.getElementAttribute(path, `${kind}.lsbFirst`)
                if (msg.controller == (lsbFirst ? 6 : 38)) {
                  const value_lsb = midiCache.getValue(portName, msg.channel, 'cc', lsbFirst ? 6 : 38, 0)
                  const value_msb = midiCache.getValue(portName, msg.channel, 'cc', lsbFirst ? 38 : 6)
                  if (Number.isInteger(value_msb) && Number.isInteger(value_lsb)) {
                    const value = (value_msb << 7) | (value_lsb & 127)
                    if (this.setParameter(path, value, kind)) {
                      debug('%s %s NRPN #%y %y = VAL %y INT %y SUR %y EXT %y', portName, kind, nrpn, path, value, this.getParameter(path), this.getParameter(path, kind), this.getParameter(path, 'external'))
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
            let path = this.getPathFromNumber(kind, 'cc', msg.controller)
            let lsbFirst
            let hiRes
            if (!path && msg.controller >= 32 && msg.controller < 64) {
              path = this.getPathFromNumber(kind, 'cc', msg.controller - 32)
            }
            if (path) {
              lsbFirst = this.getElementAttribute(path, `${kind}.lsbFirst`)
              hiRes = this.getElementAttribute(path, `${kind}.hiRes`)
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
              //                debug('HI %y == %y %s',msg.controller , lastController, path)
              if (path) {
                if (hiRes) {
                  const value_lsb = midiCache.getValue(portName, msg.channel, 'cc', lsbController, 0)
                  const value_msb = midiCache.getValue(portName, msg.channel, 'cc', msbController)
                  if (Number.isInteger(value_msb) && Number.isInteger(value_lsb)) {
                    value = (value_msb << 7) | (value_lsb & 127)
                  }
                }
                if (this.setParameter(path, value, kind)) {
                  debug('%s %s CC #%y %y = VAL %y INT %y SUR %y EXT %y', portName, kind, msg.controller, path, value, this.getParameter(path), this.getParameter(path, kind), this.getParameter(path, 'external'))
                }
              } else {
                debug('%s %s CC #%y NOT FOUND = VAL %y', portName, kind, msg.controller, msg.value)
              }
            }
          }
        }
      }
    }
  }

  connect(portName, kind, channel = 1, incomming = true, outgoing = true) {
    portName = Midi.normalisePortName(portName)
    const midiInput = Midi.input(portName, true, true)
    const connection = {portName, kind, channel, direction:{incomming, outgoing}}
    if (midiInput && incomming) {
      connection.eventListener = midiInput.on('message', this.handleMidi(portName, kind, channel) )
    }
    this.connections.push(connection)
  }

}

module.exports = Interface


