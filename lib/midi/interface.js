const debug = require('yves').debugger(require('../../package.json').name + ':lib:midi:' + (require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':'))

const _ = require('lodash')
const deepEqual = require('deep-equal')

const Midi = require('./midi')
const MidiCache = require('./cache')

const MidiConnection = require('./connection')

const EventEmitter = require('events')

const SmoothSurfaceControlTimeWindow = 500

class Interface extends EventEmitter {
  constructor(name, windowEmitter) {
    super()
    this.windowEmitter = windowEmitter
    this.name = name
    this.interface = require(`../../interfaces/${name}`)
    this.mapMIDI()
    this.reset()
    this.connections = []
    this.modulation = {}
    this.journal = {}

    if (this.windowEmitter) {
      this.windowEmitter.on('message', (args) => {
        debug('message %y ',args)
        this.windowEmitter.send('interface',this.interface)
      })
    }
  }

  /*  static remap(value, x1, y1, x2, y2) {
    return (value - x1) * (y2 - x2) / (y1 - x1) + x2
  }
*/
  static remap(input, inputLow, inputHigh, outputLow, outputHigh) {
    const result = ((input - inputLow) / (inputHigh - inputLow)) * (outputHigh - outputLow) + outputLow
    //    if (inputLow < 0 && inputHigh > 0 && inputLow != -inputHigh ) {

    //    }

    //    debug('input %y inputLow %y inputHigh %y outputLow %y outputHigh %y result %y',input, inputLow, inputHigh, outputLow, outputHigh, result)
    return result
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
    this.iterateElelements((template, path) => {
      this.setParameter(path, this.getElementAttribute(path, 'default', 0))
    })
    this.variant = {}
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

  isParameter(elementPath) {
    const type = this.getElementAttribute(elementPath, 'type')
    return (type == 'parameter' || type == 'feedback')
  }

  getParameter(elementPath, kind = 'internal', variant) {  // internal, surface, external, modulated
    let source = this.parameters
    let modifier
    if (elementPath.indexOf(':') >= 0) {
      const parts = elementPath.split(':')
      if (parts && parts.length >= 2) {
        elementPath = parts[0]
        modifier = parts[1]
      }
    }
    const elVariant = this.getElementAttribute(elementPath, 'variant')
    if (elVariant>=0) {
      variant = elVariant
    } else {
      if (typeof(variant) == 'undefined') {
        variant = this.getParameter('variant','internal',0)
      }
      if (variant > 0) {
        if (this.variants && _.has(this.variants,`${String.fromCharCode(64+variant)}.parameters.${elementPath}`)) {
          source = this.variants[String.fromCharCode(64+variant)].parameters
        }
      }
    }
    const type = this.getElementAttribute(elementPath, 'type')
    if (type == 'parameter' || type == 'feedback') {

      let result = _.get(source, elementPath, this.getElementAttribute(elementPath, 'default', 0) )

      if (kind == 'surface' || kind == 'external') {
        if (!this.getElementAttribute(elementPath, kind)) {
          return null
        }
        let x1 = this.getElementAttribute(elementPath, 'min', this.getElementAttribute(elementPath, `${kind}.min`, 0))
        let y1 = this.getElementAttribute(elementPath, 'max', this.getElementAttribute(elementPath, `${kind}.max`, 127))
        const x2 = this.getElementAttribute(elementPath, `${kind}.min`, this.getElementAttribute(elementPath, 'min', 0))
        const y2 = this.getElementAttribute(elementPath, `${kind}.max`, this.getElementAttribute(elementPath, 'max', 127))
        if ((x1 != x2) || (y1 != y2)) {
          result = Interface.remap(result, x1, y1, x2, y2)
        }
        return Math.round(result)
      }

      if (kind == 'modulated') {
        const lfoFactor = this.getModulation('lfo', elementPath)
        const matrixFactor = this.getModulation('matrix', elementPath)
        const ln = typeof lfoFactor == 'number' && isFinite(lfoFactor)
        const mn = typeof matrixFactor == 'number' && isFinite(matrixFactor)
        if (ln || mn) {
          const modFactor = (ln && mn) ? (lfoFactor + matrixFactor) / 2 : ( ln ? lfoFactor : ( mn ? matrixFactor : 0 ) )
          if (typeof modFactor == 'number' && isFinite(modFactor)) {
            if (modFactor > 0) {
              result = result + ((this.getElementAttribute(elementPath, 'max') - result) * modFactor)
            } else {
              result = result + ((result - this.getElementAttribute(elementPath, 'min')) * modFactor)
            }
          }
        }
      }

      const precision = this.getElementAttribute(elementPath, 'precision', 2)
      if (Number.isInteger(precision)) {
        result = Number.parseFloat(Number.parseFloat(result).toFixed(precision))
      }

      return this.applyModifier(modifier, result)
    } else {
      debug('getParameter: Element %y is not a parameter (it is a %y)', elementPath, type)
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

  setParameter(elementPath, value, origin = 'internal', variant, emitChanges = true) {
    let target = this.parameters

    const elVariant = this.getElementAttribute(elementPath, 'variant')
    if (elVariant>=0) {
      variant = elVariant
    } else {
      if (typeof(variant) == 'undefined') {
        variant = this.getParameter('variant','internal',0)
      }
      if (variant > 0) {
        if (!_.has(this,`variants.${String.fromCharCode(64+variant)}.parameters`)) _.set(this,`variants.${String.fromCharCode(64+variant)}.parameters`,{})
        target = this.variants[String.fromCharCode(64+variant)].parameters
      }
    }

    if (elementPath.indexOf(':') >= 0) {
      const parts = elementPath.split(':')
      if (parts && parts.length >= 2) {
        elementPath = parts[0]
        value = this.applyModifier(parts[1], value)
      }
    }
    const type = this.getElementAttribute(elementPath, 'type')
    if (type == 'parameter' || type == 'feedback') {
      if (typeof value != 'number') {
        value = this.getElementAttribute(elementPath, 'default', 0)
      }
      const min = this.getElementAttribute(elementPath, 'min', 0)
      const max = this.getElementAttribute(elementPath, 'max', 127)
      /*    debug('setParameter %y %y %y', elementPath, value, origin)*/
      if (origin == 'surface' || origin == 'external') {
        let x1 = this.getElementAttribute(elementPath, `${origin}.min`, this.getElementAttribute(elementPath, 'min', 0))
        let y1 = this.getElementAttribute(elementPath, `${origin}.max`, this.getElementAttribute(elementPath, 'max', 127))
        const x2 = this.getElementAttribute(elementPath, 'min', this.getElementAttribute(elementPath, `${origin}.min`, 0))
        const y2 = this.getElementAttribute(elementPath, 'max', this.getElementAttribute(elementPath, `${origin}.max`, 127))
        if ((x1 != x2) || (y1 != y2)) {
          if (((y1 - x1) % 2) != ((y2 - x2) % 2) ) {
            if (value < (y1 - x1)) {
              y1--
            } else {
              x1++
            }
          }
          let v = this.getElementAttribute(elementPath, 'integer', false) ? Math.round(Interface.remap(value, x1, y1, x2, y2)) : Interface.remap(value, x1, y1, x2, y2)
          if (v < min) {
            v = min
          }
          if (v > max) {
            v = max
          }
          //          debug('setParameter elementPath %y origin %y value %y x1 %y y1 %y x2 %y y2 %y = %y', elementPath, origin, value, x1, y1, x2, y2, v)
          value = Interface.remap(value, x1, y1, x2, y2)
        }
      }
      if (this.getElementAttribute(elementPath, 'integer', false)) {
        value = Math.round(value)
      }
      if (value < min) {
        debug('Outside Range Warning %y = %y (min = %y)', elementPath, value, min)
        value = min
      }
      if (value > max) {
        debug('Outside Range Warning %y = %y (max = %y)', elementPath, value, max)
        value = max
      }
      if ( this.getParameter(elementPath,origin,variant) !== value ) {

        if (origin != 'surface') {
          const timestamp = _.get(this.journal, `${elementPath}.surface`)
          if (timestamp) {
            if ((Date.now() - timestamp) < SmoothSurfaceControlTimeWindow) {
              debug('Smooth Ignore %y = %y (current %y) (origin %y) delta %y ms', elementPath, value, this.getParameter(elementPath,origin,variant), origin, Date.now() - timestamp)
              return
            }
          }
        }
        if (!this.getElementAttribute(elementPath, 'silent', false) && this.connections && this.connections.length) {
          let val
          this.emit('display', elementPath, value, origin, (label) => {
            val = label
          })
          if (typeof val == 'undefined') {
            if (Array.isArray(this.getElementAttribute(elementPath, 'list'))) {
              const list = this.getElementAttribute(elementPath, 'list')
              val = list[value]
            } else {
              val = Number.parseFloat(Number.parseFloat(value).toFixed(this.getElementAttribute(elementPath, 'precision', 2)))
            }
          }

          /*        debug('setParameter (%s) %y = %s %s', origin, elementPath, val, this.getElementAttribute(elementPath, 'unit', ''))*/

          const name = this.getElementAttribute(elementPath, 'name')
          debug('received (from %y) (variant %y) %y (%y) = %s %s', origin, variant, elementPath, name ? name : elementPath, val, this.getElementAttribute(elementPath, 'unit', ''))
        }
        if (origin != 'internal' && emitChanges) {
          this.emit('parameterChangeEminent', elementPath, value, origin)
        }

//        const jj = this.getParameter(elementPath,'internal',variant)
        const originalValue = (!variant || _.has(target, elementPath)) ? _.get(target, elementPath) : _.get(this.parameters, elementPath)
/*        const originalValue = this.getParameter(elementPath,origin,variant)*/
//        console.log('---',variant,jj,value,originalValue)
        if (variant>0 && this.getParameter(elementPath,origin,0) === value) {
          _.unset(target,elementPath)

          function removeEmptyObjects(obj) {
            for (let key in obj) {
              if (typeof obj[key] == 'object') {
                removeEmptyObjects(obj[key])
                if (!Object.keys(obj[key]).length) {
                  delete obj[key]
                }
              }
            }
          }

          removeEmptyObjects(target)
        } else {
          _.set(target, elementPath, value)


        }

        _.set(this.journal, `${elementPath}.${origin}`, Date.now())


        if (variant == this.getParameter('variant','internal',0) || variant == elVariant || !_.has(this,`variants.${String.fromCharCode(64+variant)}.parameters.${elementPath}`)) {
          for (let c in this.connections) {
            if (this.connections[c].kind != origin && this.getElementAttribute(elementPath, this.connections[c].kind)) {
              debug('send (to %y) %y (%y) = midi %y (intern %y)', this.connections[c].kind, elementPath, this.getElementAttribute(elementPath, 'name', elementPath), this.getParameter(elementPath, this.connections[c].kind), this.getParameter(elementPath))
              this.connections[c].sendParameter(elementPath, `interface.${elementPath}`, 10)
            }
          }
          if (this.windowEmitter) {
            debug('send (to %y) %y (%y) = value %y (intern %y)', 'window', elementPath, this.getElementAttribute(elementPath, 'name', elementPath), this.getParameter(elementPath, 'window'), this.getParameter(elementPath))
            this.windowEmitter.send('parameter',{path:elementPath, value, variant})
          }
        }
        if (origin != 'internal' && emitChanges) {
          this.emit('parameterChange', elementPath, value, origin, originalValue)
        }
        return true // CHANGED
      }
    } else {
      debug('setParameter: Element %y is not a parameter (it is a %y)', elementPath, type)
    }
    return false // UN-CHANGED
  }

  getParameterJournal(path, origin) {
    return _.get(this.journal, `${path}.${origin}`)
  }

  getParameters() {
    return this.parameters
  }

  getVariants() {
    return this.variants
  }

  setParameters(source) {

    if (_.isPlainObject(source)) {

      /*      this.iterateElelements((template,path) => {
        const value = _.get(source, path,this.getElementAttribute(path,'default'))
        if (typeof value != 'undefined') {
          debug('A: %y = %y',path,value)
          this.setParameter(path, value)
        }
      }, null, ['parameter'])
*/
      const copySelective = (source, template, path = '') => {
        if (template) {
          if (Interface.isEdge(template)) {
            if (template.type == 'parameter') {
              // debug('B: %y = %y',path,source)
              this.setParameter(path, source)
            }
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

  getVariantParameters(variant) {
    return _.get(this,`variants.${String.fromCharCode(64+variant)}.parameters`,{})
  }

  setVariantParameters(variant, source) {
    if (_.isPlainObject(source)) {
      const copySelective = (source, template, path = '') => {
        if (template) {
          if (Interface.isEdge(template)) {
            if (template.type == 'parameter') {
              if (typeof source != 'undefined') {
//               debug('B:(%y) %y = %y',variant,path,source)
                const elVariant = this.getElementAttribute(path, 'variant')
                if (typeof elVariant == "undefined" || elVariant == variant) {
                  this.setParameter(path, source, 'internal', variant)
                }
//               debug('B:after (%y) %y = %y',variant, path, this.getParameter(path, 'internal', variant))
              }
            }
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
      if (variant>0) {
        _.set(this,`variants.${String.fromCharCode(64+variant)}.parameters`,{})
      }
      copySelective(source, this.interface.elements)
      if (variant==0) {
        source={}
      }
    } else {
      debug('not plain object',typeof source,source)
    }
    debug('final variant %y %y',String.fromCharCode(64+variant),_.get(this,`variants.${String.fromCharCode(64+variant)}.parameters`,{}))
  }

  getVariantState(variant) {
    return _.get(this,`variants.${String.fromCharCode(64+variant)}.state`,{})
  }

  setVariantState(variant, source) {
    if (variant>0) {
      _.set(this,`variants.${String.fromCharCode(64+variant)}.state`,source?JSON.parse(JSON.stringify(source)):source)
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

  triggerIncoming(msg, origin, channel) {
    return this.emit('incoming', msg, origin, channel)
  }

  connection(kind) {
    const filtered = this.connections.filter( connection => connection.kind == kind )
    return (filtered && filtered.length) ? filtered[0] : null
  }

  connect(portName, kind, channel = 0, incoming = true, outgoing = true, active = true) {
    const result = new MidiConnection(portName, kind, channel, incoming, outgoing, active, this)
    this.connections.push(result)
    return result
  }

  emitParameters(origin = 'internal') {
    const emitSelective = (template, path = '') => {
      if (template) {
        if (Interface.isEdge(template) && template.type == 'parameter') {
          this.emit('parameterChange', path, this.getParameter(path), origin)
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
        debug('send (to %y) %y (%y) = midi %y (intern %y)', connection.kind, path, this.getElementAttribute(path, 'name', path), this.getParameter(path, connection.kind), this.getParameter(path))
        connection.sendParameter(path, `interface.${path}`, 10)
      }, connection)
    })

    if (this.windowEmitter) {
      this.iterateElelements((template, path) => {
        debug('send (to %y) %y (%y) = value %y (intern %y)', 'window', path, this.getElementAttribute(path, 'name', path), this.getParameter(path, 'window'), this.getParameter(path))
        this.windowEmitter.send('parameter',{path, value:this.getParameter(path), variant:this.getParameter('variant')})
      })
    }

  }

  sendValue(path,target) {
    this.connections.filter( connection => connection.kind == target ).forEach(connection => {
      debug('send (to %y) %y (%y) = midi %y (intern %y)', connection.kind, path, this.getElementAttribute(path, 'name', path), this.getParameter(path, connection.kind), this.getParameter(path))
      connection.sendParameter(path, `interface.${path}`, 10)
    })
    if (this.windowEmitter) {
      debug('send (to %y) %y (%y) = value %y (intern %y)', 'window', path, this.getElementAttribute(path, 'name', path), this.getParameter(path, 'window'), this.getParameter(path))
      this.windowEmitter.send('parameter',{path, value:this.getParameter(path), variant:this.getParameter('variant')})
    }
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

    this.clearModulation('matrix')

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

    const deltaKeys = Object.keys(deltaValues)

    if (deltaKeys.length) {
      deltaKeys.forEach( deltaKey => {
        this.emit('modulationChange', deltaKey, deltaValues[deltaKey], reason)
      })
      debug('Matrix Modulation Impact: %y', deltaValues)
    }
  }
}

module.exports = Interface


