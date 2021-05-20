const debug = require('debug')(require('../package.json').name + ':lib:' + (require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':'))

const _ = require('lodash')
const deepEqual = require('deep-equal')

const deepSortObject = require('deep-sort-object')

const Midi = require('./midi')
const MidiCache = require('./midiCache')

const MidiConnection = require('./midiConnection')

const remap = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2

const EventEmitter = require('events')

class Interface  extends EventEmitter {
  constructor(name) {
    super()
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
    /*    debug('map %y', this.map)*/
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
      debug('getParameter path %y kind %y result %y x1 %y y1 %y x2 %y y2 %y = %y', path, kind, result, x1, y1, x2, y2, Math.round(remap(result, x1, y1, x2, y2)))
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
    const min = this.getElementAttribute(path, 'min',0)
    const max = this.getElementAttribute(path, 'max',127)
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
      let v=this.getElementAttribute(path, 'integer',false)?Math.round(remap(value, x1, y1, x2, y2)):remap(value, x1, y1, x2, y2)
      if (v<min) v=min
      if (v>max) v=max
      debug('setParameter path %y origin %y value %y x1 %y y1 %y x2 %y y2 %y = %y', path, origin, value, x1, y1, x2, y2, v)
      value = remap(value, x1, y1, x2, y2)
    }
    if (this.getElementAttribute(path, 'integer',false)) {
      value = Math.round(value)
    }
    if (value<min) {
      debug('Outside Range Warning %y = %y (min = %y)',path,value,min)
      value=min
    }
    if (value>max) {
      debug('Outside Range Warning %y = %y (max = %y)',path,value,max)
      value=max
    }
    if ( _.set(this.parameters, path) !== value ) {
      _.set(this.parameters, path, value)
      this.emit('parameterChange',path,value)
      for (let c in this.connections) {
        if (this.connections[c].kind != origin && this.getElementAttribute(path, this.connections[c].kind)) {
          this.connections[c].sendParameter(path, this.connections[c].portName, this.connections[c].channel, this.connections[c].kind)
        }
      }
      return true // CHANGED
    }
    return false // UN-CHANGED
  }

  getParameters() {
    return deepSortObject(this.parameters)
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

  connect(portName, kind, channel = 0, incomming = true, outgoing = true) {
    this.connections.push(new MidiConnection(portName, kind, channel, incomming, outgoing, this))
  }

}

module.exports = Interface


