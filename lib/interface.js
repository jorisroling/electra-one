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
    this.reset()
  }

  reset() {
    const resetSelective = (template, path = '') => {
      if (template) {
        if (Interface.isEdge(template)) {
          _.set(this, `parameters.${path}`, _.get(template, 'default', 0) )
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
    return _.get(this.interface.elements,path)
  }

  getParameter(path, kind = 'internal') {  // internal, surface, external, modulated
    let result = _.get(this.state, path, _.get(this.interface.elements, `${path}.default`, 0))

    if (kind == 'surface' || kind == 'external') {
      const x1 = _.get(this.interface.elements, `${path}.min`, _.get(this.interface.elements, `${path}.${kind}.min`, 0))
      const y1 = _.get(this.interface.elements, `${path}.max`, _.get(this.interface.elements, `${path}.${kind}.max`, 127))
      const x2 = _.get(this.interface.elements, `${path}.${kind}.min`, _.get(this.interface.elements, `${path}.min`, 0))
      const y2 = _.get(this.interface.elements, `${path}.${kind}.max`, _.get(this.interface.elements, `${path}.max`, 127))
      result = remap(result, x1, y1, x2, y2)
      return Math.round(result)
    }

    return result
  }

  setParameter(path, value) {
    let result = _.set(this.state, path, value)
    return result
  }


  read() {
    const filePath = path.resolve( (process.env.NODE_ENV == 'production') ? untildify(`~/.electra-one/state/${this.name}.json`) : `${__dirname}/../state/${this.name}.json` )
    if (fs.existsSync(filePath)) {
      const state = jsonfile.readFileSync(filePath)

      const copySelective = (source, template, path = '') => {
        if (template) {
          if (Interface.isEdge(template)) {
            _.set(this, `parameters.${path}`, typeof source === 'number' ? source : _.get(template, 'default', 0) )
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


