const config = require('config')
const _ = require('lodash')
const yves = require('../lib/yves')
const pkg = require('../package.json')
const debugShow = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:show`)

const bacara_interface = require('../interfaces/bacara.js')

const cc = {}

function show(path) {

	const base = path ? _.get(bacara_interface.elements,path) : bacara_interface.elements
  if (typeof base == 'object') {
    if (base.surface || base.external) {
      if (base.external && base.external.type == 'cc') {
        cc[''+base.external.number] = path
      }
/*      debugShow('element: %y',path)*/
    }
  	for (let key in base) {
      if (key !='surface' && key != 'external') {
        const ep = path?`${path}.${key}`:`${key}`
    		show(ep)
      }
  	}
  }
//	debugShow('base: %y',base)

}

function spec(name, sub, options) {
/*  debugShow('hi: %y',bacara_interface)*/

	show()

	debugShow('cc: %y',cc)
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