const debug = require('debug')(require('../../package.json').name + ':lib:midi:' + (require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':'))

const _ = require('lodash')
const deepEqual = require('deep-equal')

const Midi = require('./midi')
const MidiCache = require('./cache')

const MidiConnection = require('./connection')

const EventEmitter = require('events')

class Interface  extends EventEmitter {
  constructor(name) {
    super()
    this.name = name
    this.interface = require(`../../interfaces/${name}`)
    this.mapMIDI()
    this.reset()
    this.connections = []
  }

  static remap(value, x1, y1, x2, y2) {
    return (value - x1) * (y2 - x2) / (y1 - x1) + x2
  }


  mapMIDI() {
    const mapSelective = (template, path = '') => {
      if (template) {
        if (Interface.isEdge(template)) {
          ['surface', 'external'].forEach( origin => {
            if (template[origin]) {
              if ((template[origin].type == 'nrpn' || template[origin].type == 'cc' || template[origin].type == 'sysex') && Number.isInteger(template[origin].number)) {
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
    /*    debug('map %y', this.map)*/
  }

  getPathFromNumber(origin, type, number) {
    const mapPath = `${origin}.${type}.#${number}`
    const result = _.get(this.map, mapPath)
    /*    debug('getPathFromNumber %y = %y',mapPath,result)*/
    return result
  }

  getPathsFromType(origin, type) {
    const mapPath = `${origin}.${type}`
    const result = _.get(this.map, mapPath)
    /*    debug('getPathsFromType %y = %y',mapPath,result)*/
    return result
  }

  reset(origin = 'internal') {
    const resetSelective = (template, path = '') => {
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

  getParameter(path, kind = 'internal') {  // internal, surface, external, modulated
    let modifier
    if (path.indexOf(':') >= 0) {
      const parts = path.split(':')
      if (parts && parts.length >= 2) {
        path = parts[0]
        modifier = parts[1]
      }
    }
    const type = this.getElementAttribute(path, 'type')
    if (type == 'parameter' || type == 'feedback') {
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
          const value = Interface.remap(result, x1, y1, x2, y2)
          if (value < (y2 - x2)) {
            y1++
          } else {
            x1--
          }
        }
        debug('getParameter path %y kind %y result %y x1 %y y1 %y x2 %y y2 %y = %y', path, kind, result, x1, y1, x2, y2, Math.round(Interface.remap(result, x1, y1, x2, y2)))
        result = Interface.remap(result, x1, y1, x2, y2)
        return Math.round(result)
      }

      const precision = this.getElementAttribute(path, 'precision', 2)
      if (Number.isInteger(precision)) {
        result = Number.parseFloat(Number.parseFloat(result).toFixed(precision))
      }
      return this.applyModifier(modifier, result)
    } else {
      debug('Element %y is not a parameter (it is a %y)', path, type)
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
        debug('setParameter path %y origin %y value %y x1 %y y1 %y x2 %y y2 %y = %y', path, origin, value, x1, y1, x2, y2, v)
        value = Interface.remap(value, x1, y1, x2, y2)
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
        debug('set %y = %y', path, value)
        _.set(this.parameters, path, value)
        for (let c in this.connections) {
          if (this.connections[c].kind != origin && this.getElementAttribute(path, this.connections[c].kind)) {
            this.connections[c].sendParameter(path)
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
    }
  }

  getElementPathBySysEx(origin, bytes) {
    if (Array.isArray(bytes) && bytes.length) {
      const sysexPaths = this.getPathsFromType(origin, 'sysex')

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

  }

  iterateElelements(callback,parameter,types) {
    if (!types) {
      types = ['parameter', 'feedback']
    }
    const iterateSelective = (template, path = '') => {
      if (template) {
        if (Interface.isEdge(template) && types.indexOf(template.type)>=0) {
          callback(path,parameter)
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

/*    const sendSelective = (connection,template, path = '') => {
      if (template) {
        if (Interface.isEdge(template) && (template.type == 'parameter' || template.type == 'feedback')) {
          connection.sendParameter(path)
        } else {
          const templateKeys = Object.keys(template)
          for (const templateKey of templateKeys) {
            if (_.isPlainObject(template[templateKey]) || Array.isArray(template[templateKey])) {
              sendSelective(connection,template[templateKey], `${path ? path + '.' : ''}${templateKey}`,)
            }
          }
        }
      }
    }

    this.connections.filter( connection => connection.kind == target ).forEach(connection => {
      sendSelective(connection,this.interface.elements)
    })

*/
    debug('JJR')
    this.connections.filter( connection => connection.kind == target ).forEach(connection => {
      this.iterateElelements((path,connection) => {
        debug('send %y',path)
        connection.sendParameter(path)
      },connection)
    })
  }
}

module.exports = Interface


