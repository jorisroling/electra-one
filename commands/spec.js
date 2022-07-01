const config = require('config')
const _ = require('lodash')
const yves = require('../lib/yves')
const pkg = require('../package.json')
const debugShow = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:show`)

const bacara_interface = require('../interfaces/bacara.js')

const external_cc = {}
const external_nrpn = {}

const surface_cc = {}
const surface_nrpn = {}


function show(path) {

  const base = path ? _.get(bacara_interface.elements, path) : bacara_interface.elements
  if (typeof base == 'object') {
    if (base.surface) {
      if (base.surface.type == 'cc') {
        if (base.surface.hiRes) {
          if (surface_cc['' + base.surface.number]) {
            debug('Surface: %y & %y share the same CC (%y)', surface_cc['' + base.surface.number], path + ' (MSB)', base.surface.number)
          }
          surface_cc['' + base.surface.number] = path + ' (MSB)'
          if (surface_cc['' + (base.surface.number + 32)]) {
            debug('Surface: %y & %y share the same CC (%y)', surface_cc['' + (base.surface.number + 32)], path + ' (LSB)', base.surface.number)
          }
          surface_cc['' + (base.surface.number + 32)] = path + ' (LSB)'
        } else {
          if (surface_cc['' + base.surface.number]) {
            debug('Surface: %y & %y share the same CC (%y)', surface_cc['' + base.surface.number], path, base.surface.number)
          }
          surface_cc['' + base.surface.number] = path
        }
      }
      if (base.surface.type == 'nrpn') {
        if (surface_nrpn['' + base.surface.number]) {
          debug('Surface: %y & %y share the same NRPN (%y)', surface_nrpn['' + base.surface.number], path, base.surface.number)
        }
        surface_nrpn['' + base.surface.number] = path
      }
    }
    if (base.external) {
      if (base.external.type == 'cc') {
        if (base.external.hiRes) {
          if (external_cc['' + base.external.number]) {
            debug('External: %y & %y share the same CC (%y)', external_cc['' + base.external.number], path + ' (MSB)', base.external.number)
          }
          external_cc['' + base.external.number] = path + ' (MSB)'
          if (external_cc['' + (base.external.number + 32)]) {
            debug('External: %y & %y share the same CC (%y)', external_cc['' + (base.external.number + 32)], path + ' (LSB)', base.external.number)
          }
          external_cc['' + (base.external.number + 32)] = path + ' (LSB)'
        } else {
          if (external_cc['' + base.external.number]) {
            debug('External: %y & %y share the same CC (%y)', external_cc['' + base.external.number], path, base.external.number)
          }
          external_cc['' + base.external.number] = path
        }
      }
      if (base.external.type == 'nrpn') {
        if (external_nrpn['' + base.external.number]) {
          debug('External: %y & %y share the same NRPN (%y)', external_nrpn['' + base.external.number], path, base.external.number)
        }
        external_nrpn['' + base.external.number] = path
      }

      /*      debugShow('element: %y',path)*/
    }
    for (let key in base) {
      if (key != 'surface' && key != 'external') {
        const ep = path ? `${path}.${key}` : `${key}`
        show(ep)
      }
    }
  }
  //	debugShow('base: %y',base)

}

function spec(name, sub, options) {
/*  debugShow('hi: %y',bacara_interface)*/

  show()

  debugShow('surface cc: %y', surface_cc)
  debugShow('surface nrpn: %y', surface_nrpn)

  debugShow('external cc: %y', external_cc)
  debugShow('external nrpn: %y', external_nrpn)
}

module.exports = {
  name: 'spec',
  description: 'List MIDI spec based on current interface',
  handler: spec,
  examples: [
    {usage:'electra-one spec', description:'Show current MIDI spec'},
  ],
  aliases:[]
}