const _ = require('lodash')
const deepEqual = require('deep-equal')
const fs = require('fs-extra')
const path = require('path')
const untildify = require('untildify')
const jsonfile = require('jsonfile')

const Acid = require('../lib/acid')
const deepSortObject = require('deep-sort-object')


const remap = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2

class Interface  {
  constructor(name) {
    this.name = name
    this.interface = require(`../interfaces/${name}`)
    this.mapMIDI()
    this.reset()
  }

  mapMIDI() {
    const mapSelective = (template, path = '') => {
      if (template) {
        if (Interface.isEdge(template)) {
          //          _.set(this, `parameters.${path}`, _.get(template, 'default', 0) )
          ['surface', 'external'].forEach( origin => {
            if (template[origin]) {
              if ((template[origin].type == 'nrpn' || template[origin].type == 'cc') && Number.isInteger(template[origin].number)) {
                _.set(this.map, `${origin}.${template[origin].type}.#${template[origin].number}`, path)
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
    return _.get(this.map, `${origin}.${type}.#${number}`)
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
    _.set(this.parameters, path, value)
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

}

module.exports = Interface


