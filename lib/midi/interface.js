const debug = require('debug')(require('../../package.json').name + ':lib:midi:' + (require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':'))

const _ = require('lodash')
const deepEqual = require('deep-equal')

const Midi = require('./midi')
const MidiCache = require('./cache')

const MidiConnection = require('./connection')

const EventEmitter = require('events')

const Acid = require('../../lib/acid')

class Interface  extends EventEmitter {
  constructor(name) {
    super()
    this.name = name
    this.interface = require(`../../interfaces/${name}`)
    this.mapMIDI()
    this.reset()
    this.connections = []
    this.modulation = {}
  }

  static remap(value, x1, y1, x2, y2) {
    return (value - x1) * (y2 - x2) / (y1 - x1) + x2
  }


  mapMIDI() {
    this.map = {}

    this.iterateElelements((template, path) => {
      ['surface', 'external'].forEach( origin => {
        if (template[origin]) {
          if ((template[origin].type == 'nrpn' || template[origin].type == 'cc' || template[origin].type == 'sysex') && Number.isInteger(template[origin].number)) {
            const mapPath = `${origin}.${template[origin].type}.#${template[origin].number}`
            if (this.getMapPath(origin, template[origin].type, template[origin].number)) {
              debug('Warning! Double assignment of elements %s -> %y %y', this.name, mapPath, template[origin])
            }
            this.setMapPath(origin, template[origin].type, template[origin].number, path)
          } else {
            debug('What? %y', template[origin])
          }
        }
      })
    }, null, ['parameter', 'feedback', 'action'])
    //    debug('map %y',this.map)

  }

  reset(origin = 'internal') {
    /*    const resetSelective = (template, path = '') => {
      if (template) {
        if (Interface.isEdge(template)) {
          this.setParameter(path, _.get(template, 'default', 0))
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
*/
    this.iterateElelements((template, path) => {
      this.setParameter(path, this.getElementAttribute(path, 'default', 0))
    })
  }

  static isEdge(node) {
    return _.isPlainObject(node) && (node.surface || node.external) && node.type && node.name
  }

  getElements() {
    return this.interface.elements
  }

  getElement(path) {
    return _.get(this.interface.elements, path)
  }

  getElementAttribute(path, attribute, deflt) {
    return _.get(this.interface.elements, `${path}.${attribute}`, deflt)
  }

  getParameter(elementPath, kind = 'internal') {  // internal, surface, external, modulated
    let modifier
    if (elementPath.indexOf(':') >= 0) {
      const parts = elementPath.split(':')
      if (parts && parts.length >= 2) {
        elementPath = parts[0]
        modifier = parts[1]
      }
    }
    const type = this.getElementAttribute(elementPath, 'type')
    if (type == 'parameter' || type == 'feedback') {
      let result = _.get(this.parameters, elementPath, this.getElementAttribute(elementPath, 'default', 0) )

      if (kind == 'surface' || kind == 'external') {
        if (!this.getElementAttribute(elementPath, kind)) {
          return null
        }
        let x1 = this.getElementAttribute(elementPath, 'min', this.getElementAttribute(elementPath, `${kind}.min`, 0))
        let y1 = this.getElementAttribute(elementPath, 'max', this.getElementAttribute(elementPath, `${kind}.max`, 127))
        const x2 = this.getElementAttribute(elementPath, `${kind}.min`, this.getElementAttribute(elementPath, 'min', 0))
        const y2 = this.getElementAttribute(elementPath, `${kind}.max`, this.getElementAttribute(elementPath, 'max', 127))
        if ((x1 != x2) || (y1 != y2)) {
          if (((y1 - x1) % 2) != ((y2 - x2) % 2) ) {
            const value = Interface.remap(result, x1, y1, x2, y2)
            if (value < (y2 - x2)) {
              y1++
            } else {
              x1--
            }
          }
          //        debug('getParameter elementPath %y kind %y result %y x1 %y y1 %y x2 %y y2 %y = %y', elementPath, kind, result, x1, y1, x2, y2, Math.round(Interface.remap(result, x1, y1, x2, y2)))
          result = Interface.remap(result, x1, y1, x2, y2)
        }
        return Math.round(result)
      }

      if (kind == 'modulated') {
        const lfoFactor = this.getModulation('lfo', elementPath)
        const matrixFactor = this.getModulation('matrix', elementPath)
        const ln = typeof lfoFactor == 'number'
        const mn = typeof matrixFactor == 'number'
        const modFactor = (ln && mn) ? (lfoFactor + matrixFactor) / 2 : ( ln ? lfoFactor : ( mn ? matrixFactor : 0 ) )
        if (modFactor) {
          if (modFactor > 0) {
            result = result + Math.round((this.getElementAttribute(elementPath, 'max') - result) * modFactor)
          } else {
            result = result + Math.round((result - this.getElementAttribute(elementPath, 'min')) * modFactor)
          }
        }
      }

      const precision = this.getElementAttribute(elementPath, 'precision', 2)
      if (Number.isInteger(precision)) {
        result = Number.parseFloat(Number.parseFloat(result).toFixed(precision))
      }

      return this.applyModifier(modifier, result)
    } else {
      debug('Element %y is not a parameter (it is a %y)', elementPath, type)
    }
  }

  applyModifier(modifier, value) {
    if (typeof modifier == 'string') {
      modifier = modifier.replace(/\s/g, '').toLowerCase()
      if (modifier[0] == '+' || modifier[0] == '-') {
        value += parseInt(modifier)
      }
    }
    return value
  }

  setParameter(path, value, origin = 'internal') {
    if (path.indexOf(':') >= 0) {
      const parts = path.split(':')
      if (parts && parts.length >= 2) {
        path = parts[0]
        value = this.applyModifier(parts[1], value)
      }
    }
    const type = this.getElementAttribute(path, 'type')
    if (type == 'parameter' || type == 'feedback') {
      //    debug('JJR')
      if (typeof value != 'number') {
        value = this.getElementAttribute(path, 'default', 0)
      }
      const min = this.getElementAttribute(path, 'min', 0)
      const max = this.getElementAttribute(path, 'max', 127)
      /*    debug('setParameter %y %y %y', path, value, origin)*/
      if (origin == 'surface' || origin == 'external') {
        let x1 = this.getElementAttribute(path, `${origin}.min`, this.getElementAttribute(path, 'min', 0))
        let y1 = this.getElementAttribute(path, `${origin}.max`, this.getElementAttribute(path, 'max', 127))
        const x2 = this.getElementAttribute(path, 'min', this.getElementAttribute(path, `${origin}.min`, 0))
        const y2 = this.getElementAttribute(path, 'max', this.getElementAttribute(path, `${origin}.max`, 127))
        if ((x1 != x2) || (y1 != y2)) {
          if (((y1 - x1) % 2) != ((y2 - x2) % 2) ) {
            if (value < (y1 - x1)) {
              y1--
            } else {
              x1++
            }
          }
          let v = this.getElementAttribute(path, 'integer', false) ? Math.round(Interface.remap(value, x1, y1, x2, y2)) : Interface.remap(value, x1, y1, x2, y2)
          if (v < min) {
            v = min
          }
          if (v > max) {
            v = max
          }
          //          debug('setParameter path %y origin %y value %y x1 %y y1 %y x2 %y y2 %y = %y', path, origin, value, x1, y1, x2, y2, v)
          value = Interface.remap(value, x1, y1, x2, y2)
        }
      }
      if (this.getElementAttribute(path, 'integer', false)) {
        value = Math.round(value)
      }
      if (value < min) {
        debug('Outside Range Warning %y = %y (min = %y)', path, value, min)
        value = min
      }
      if (value > max) {
        debug('Outside Range Warning %y = %y (max = %y)', path, value, max)
        value = max
      }
      if ( _.get(this.parameters, path) !== value ) {
        if (!this.getElementAttribute(path, 'silent', false)) {
          let val
          this.emit('display', path, value, origin, (label) => {
            val = label
          })
          if (typeof val == 'undefined') {
            if (Array.isArray(this.getElementAttribute(path, 'list'))) {
              const list = this.getElementAttribute(path, 'list')
              val = list[value]
            } else {
              val = Number.parseFloat(Number.parseFloat(value).toFixed(this.getElementAttribute(path, 'precision', 2)))
            }
          }

  /*        debug('setParameter (%s) %y = %s %s', origin, path, val, this.getElementAttribute(path, 'unit', ''))*/

          const name = this.getElementAttribute(path, 'name')
          debug('%y = %s %s', name?name:path, val, this.getElementAttribute(path, 'unit', ''))
        }
        _.set(this.parameters, path, value)
        for (let c in this.connections) {
          if (this.connections[c].kind != origin && this.getElementAttribute(path, this.connections[c].kind)) {
            this.connections[c].sendParameter(path, `interface.${path}`, 10)
          }
        }
        if (origin != 'internal') {
          this.emit('parameterChange', path, value, origin)
        }
        return true // CHANGED
      }
    } else {
      debug('Element %y is not a parameter (it is a %y)', path, type)
    }
    return false // UN-CHANGED
  }

  getParameters() {
    return this.parameters
  }

  setParameters(source) {
    if (_.isPlainObject(source)) {
      const copySelective = (source, template, path = '') => {
        if (template) {
          if (Interface.isEdge(template)) {
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
      copySelective(source, this.interface.elements)

      /*      debug('source %y',source)
      this.iterateElelements((template,path) => {
        this.setParameter(path, _.get(source, path))
      })*/
    }
  }

  getElementPathBySysEx(origin, bytes) {
    if (Array.isArray(bytes) && bytes.length) {
      const sysexPaths = this.getMap(origin, 'sysex')

      for (let p in sysexPaths) {
        const element = this.getElement(sysexPaths[p])
        if (_.get(element, `${origin}.type`) == 'sysex') {
          const elementBytes = _.get(element, `${origin}.bytes`)
          if (Array.isArray(elementBytes) && elementBytes.length) {
            let i = 0
            while (i < bytes.length && i < elementBytes.length && typeof bytes[i] == 'number' && typeof elementBytes[i] == 'number' && bytes[i] == elementBytes[i]) {
              if (bytes[i] == 0xF7) {
                break
              }
              i++
            }
            if (i >= 3) {
              return sysexPaths[p]
            }
          }
        }
      }
    }
  }

  setParameterFromSysex(path, origin, bytes) {
    const element = this.getElement(path)
    if (_.get(element, `${origin}.type`) == 'sysex') {
      const elementBytes = _.get(element, `${origin}.bytes`)
      if (Array.isArray(elementBytes) && elementBytes.length) {
        let i = 0
        while (i < bytes.length && i < elementBytes.length && typeof bytes[i] == 'number' && typeof elementBytes[i] == 'number' && bytes[i] == elementBytes[i]) {
          if (bytes[i] == 0xF7) {
            break
          }
          i++
        }
        if (i >= 3 && typeof elementBytes[i] == 'string') {
          return this.setParameter(elementBytes[i] == '*' ? path : elementBytes[i], bytes[i], origin)  // rough!
        }
      }
    }
  }

  triggerAction(path, origin) {
    return this.emit('action', path, origin)
  }

  connect(portName, kind, channel = 0, incomming = true, outgoing = true) {
    this.connections.push(new MidiConnection(portName, kind, channel, incomming, outgoing, this))

    const emitSelective = (template, path = '') => {
      if (template) {
        if (Interface.isEdge(template) && template.type == 'parameter') {
          this.emit('parameterChange', path, this.getParameter(path), 'internal')
        } else {
          const templateKeys = Object.keys(template)
          for (const templateKey of templateKeys) {
            if (_.isPlainObject(template[templateKey]) || Array.isArray(template[templateKey])) {
              emitSelective(template[templateKey], `${path ? path + '.' : ''}${templateKey}`)
            }
          }
        }
      }
    }

    emitSelective(this.interface.elements)

    //    this.sendValues(kind)

  }

  iterateElelements(callback, parameter, types) {
    if (!types) {
      types = ['parameter', 'feedback']
    }
    const iterateSelective = (template, path = '') => {
      if (template) {
        if (Interface.isEdge(template) && types.indexOf(template.type) >= 0) {
          callback(template, path, parameter)
        } else {
          const templateKeys = Object.keys(template)
          for (const templateKey of templateKeys) {
            if (_.isPlainObject(template[templateKey]) || Array.isArray(template[templateKey])) {
              iterateSelective(template[templateKey], `${path ? path + '.' : ''}${templateKey}`,)
            }
          }
        }
      }
    }

    iterateSelective(this.interface.elements)

  }

  sendValues(target) {
    this.connections.filter( connection => connection.kind == target ).forEach(connection => {
      this.iterateElelements((template, path, connection) => {
        debug('send (%y) %y = %y', connection.kind, path, this.getParameter(path, connection.kind))
        connection.sendParameter(path, `interface.${path}`, 10)
      }, connection)
    })
  }

  getModulation(kind, path, deflt) {
    if (kind && path) {
      return _.get(this.modulation, `${kind}.${path}`, deflt)
    }
  }

  setModulation(kind, path, value) {
    if (kind && path) {
      _.set(this.modulation, `${kind}.${path}`, value)
      //      debug('setModulation %y %y = %y',kind,path,value)
    }
  }

  clearModulation(kind, path) {
    if (kind) {
      if (path) {
        _.unset(this.modulation, `${kind}.${path}`)
      } else {
        _.unset(this.modulation, `${kind}`)
      }
    }
  }

  matrixTargetCount(cc) {
    let result = 0
    for (let slotIdx = 0; slotIdx < 3; slotIdx++) {
      if (this.getParameter(`matrix.slot.${slotIdx}.source`) > 0) {
        for (let destIdx = 0; destIdx < 3; destIdx++) {
          const target = this.getParameter(`matrix.slot.${slotIdx}.destination.${destIdx}.target`)
          const amount = this.getParameter(`matrix.slot.${slotIdx}.destination.${destIdx}.amount`)
          if (target == cc && amount) {
            result++
          }
        }
      }
    }
    return result
  }

  static difference(object, base) {
    return _.transform(object, (result, value, key) => {
      if (!_.isEqual(value, base[key])) {
        result[key] = _.isObject(value) && _.isObject(base[key]) ? Interface.difference(value, base[key]) : value
      }
    })
  }

  getMap(kind, type) {
    return _.get(this.map, `${kind}.${type}`)
  }

  getMapPath(kind, type, number) {
    return _.get(this.map, `${kind}.${type}.#${number}`)
  }

  setMapPath(kind, type, number, path) {
    _.set(this.map, `${kind}.${type}.#${number}`, path)
  }

  matrixRemodulate(reason) {

    const performancePaths = this.getMap('external', 'cc') ? Object.values(this.getMap('external', 'cc')) : []
    const oldValues = {}
    performancePaths.forEach( perfPath => oldValues[perfPath] = this.getParameter(perfPath, 'modulated') )

    this.modulation.matrix = {}
    for (let slotIdx = 0; slotIdx < 3; slotIdx++) {
      if (this.getParameter(`matrix.slot.${slotIdx}.value`) > 0) {
        for (let destIdx = 0; destIdx < 3; destIdx++) {
          const target = this.getParameter(`matrix.slot.${slotIdx}.destination.${destIdx}.target`)
          const amount = this.getParameter(`matrix.slot.${slotIdx}.destination.${destIdx}.amount`)
          const targetPath = this.getMapPath('external', 'cc', target)
          if (targetPath && amount) {
            const targetCount = this.matrixTargetCount(target)

            const mod = (((this.getParameter(`matrix.slot.${slotIdx}.value`) + 1) / 128) * (amount / 100)) / targetCount
            this.setModulation('matrix', targetPath, this.getModulation('matrix', targetPath, 0) + mod)
          }
        }
      }
    }
    const newValues = {}
    performancePaths.forEach( perfPath => newValues[perfPath] = this.getParameter(perfPath, 'modulated') )
    const deltaValues = Interface.difference(newValues, oldValues)

    //      debug('modulation impact: old %y new %y delta %y ', oldValues, newValues, deltaValues)

    const tableParameters = ['scales', 'base', 'transpose', 'split', 'deviate']
    const deltaKeys = Object.keys(deltaValues)

    if (deltaKeys.length) {
      deltaKeys.forEach( deltaKey => {
        this.emit('modulationChange', deltaKey, deltaValues[deltaKey], reason)
      })
      if (_.intersection(deltaKeys, tableParameters)) {
        Acid.table(this)
      }
      debug('modulation impact: %y', deltaValues)
    }
  }

}

module.exports = Interface


