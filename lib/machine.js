const _ = require('lodash')
const deepEqual = require('deep-equal')
const fs = require('fs-extra')
const path = require('path')
const untildify = require('untildify')
const jsonfile = require('jsonfile')

const Acid = require('../lib/acid')

class Machine  {
  constructor(name) {
    this.name = name
    this.interface = require(`../interfaces/${name}`)
    this.parameters = {}

  }

  getParameter(path,kind = 'modulated') {
    let result = _.get(this.state,path,_.get(this.interface.parameters,`${path}.default`,0))
    return result
  }

  setParameter(path,value) {
    let result = _.set(this.state,path,value)
    return result

    if (!deepEqual(this.getParameter(path,'raw'),value,{strict:true})) {
      _.set(this.state,path,value)
      this.write()
    }

  }


  read() {
    const filePath = path.resolve( (process.env.NODE_ENV == 'production') ? untildify(`~/.electra-one/state/${this.name}.v2.json`) : `${__dirname}/../state/${this.name}.v2.json` )
    if (fs.existsSync(filePath)) {
      const state = jsonfile.readFileSync(filePath)

      function copySelective(source,target,template) {
        const templateKeys = Object.keys(template)
        for (const templateKey of templateKeys) {
          debug('template %y:',templateKey)
          if (_.isPlainObject(template[templateKey]) && source) {
            target[templateKey] = {}
            copySelective(source[templateKey], target[templateKey], template[templateKey])
          } else if (Array.isArray(template[templateKey]) && source) {
            target[templateKey] = []
            copySelective(source[templateKey], target[templateKey], template[templateKey])
          } else {
            if (typeof _.get(source,templateKey) != 'undefined') {
              _.set(target,templateKey,_.get(source,templateKey))
            }
          }
        }
      }

      this.parameters = {}
      copySelective(state, this.parameters, this.interface.parameters)
      debug('read %y',this.parameters)
/*      const keys = Object.keys(this.values)
      for (let k in keys) {
        if (Object.prototype.hasOwnProperty.call(state,keys[k])) {
          this.values[keys[k]] = state[keys[k]]
        }
      }
*/
    }
  }

  write(quiet = false) {
    const filePath = path.resolve((process.env.NODE_ENV == 'production') ? untildify(`~/.electra-one/state/${this.name}.v2.json`) : `${__dirname}/../state/${this.name}.v2.json`)
    debug('w: %y',filePath)
    fs.ensureDirSync(path.dirname(filePath))
    jsonfile.writeFileSync(filePath, this.parameters, { flag: 'w', spaces: 2 })
    if (!quiet) {
      Acid.table(this)
    }
  }

}

const tst = new Machine('acid')
tst.write()
tst.read()

module.exports = Machine