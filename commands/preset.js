const fs = require('fs-extra')
const jsonfile = require('jsonfile')
const _ = require('lodash')
const config = require('config')
const virus = require('../lib/virus')

const Bacara = require('../lib/bacara')
const yves = require('../lib/yves')
const pkg = require('../package.json')
const debugError = yves.debugger(`${pkg.name.replace(/^@/, '')}:${(require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':')}:error`)

/*const changeCace = require('change-case')*/
const { titleCase } = require('title-case')

const torsoT1OSC = require('../extra/osc/torso-t1.json')

let args

const Interface = require('../lib/midi/interface')
const Midi = require('../lib/midi/midi')

const { devices } = require('../lib/devices')

function generatePreset(name, sub, options) {

  Midi.setupVirtualPorts(config.list.virtual)

  if (options.verbose) {
    debugError('options %y', _.fromPairs(_.toPairs(options).filter(a => a[0].length > 1 )) )
    debugError('config %y', config.util.toObject(config))
  }
  if (options.custom && options.custom.length) {
    Bacara.setPresetStateFilename(options.custom[options.custom.length - 1])
  }

  const interface = new Interface('bacara')
  if (options.focus && options.template[options.focus] /*&& options.filename*/) {
    if (fs.existsSync(options.template[options.focus])) {
      const preset = jsonfile.readFileSync(options.template[options.focus])
      if (preset) {
        preset.name = options.presetName[options.focus] ? options.presetName[options.focus] : preset.name.replace('Template', '').trim()
        const blacklistPages = []
        if (Array.isArray(preset.pages)) {
          for (let page of preset.pages) {
            const match = page.name.match(/\s*\[\s*\[\s*(.*?)\s*\]\s*\]\s*/)
            if (match) {
              const pageCondition = match[1].split('=').map( part => part.trim() )
              if (pageCondition) {
                debug('pageCondition %y', pageCondition)
                if (pageCondition[0] == 'device') {
                  if (!_.get(config, `midi.ports.${pageCondition[1]}`)) {
                    blacklistPages.push(page.id)
                  }
                }
              }
              if (blacklistPages.indexOf(page.id) >= 0) {
                //                debug('blacklistPages %y',blacklistPages)
                debug('ditch page %y as its condition %y = %y is not met.', page.name.replace(/\s*\[\s*\[\s*(.*?)\s*\]\s*\]\s*/, ''), pageCondition[0], pageCondition[1])
                page.name = 'Page ' + page.id
              } else {
                page.name = page.name.replace(/\s*\[\s*\[\s*(.*?)\s*\]\s*\]\s*/, '')
              }
            }
          }
        }
        /*        debug('blacklistPages %y',blacklistPages)*/
        if (Array.isArray(preset.groups)) {
          for (let g = preset.groups.length - 1; g >= 0; g--) {
            if (blacklistPages.indexOf(preset.groups[g].pageId) >= 0) {
              /*              debug('ditch group %y',preset.groups[g].name)*/
              preset.groups.splice(g, 1)
            }
          }
        }

        if (Array.isArray(preset.controls)) {
          for (let c = preset.controls.length - 1; c >= 0; c--) {
            if (blacklistPages.indexOf(preset.controls[c].pageId) >= 0) {
              /*              debug('ditch control %y',preset.controls[c].name)*/
              preset.controls.splice(c, 1)
            }
          }
        }

        // For newer .EPROJ preset files
        if (Array.isArray(preset.tiles)) {
          for (let tile of preset.tiles) {
            if (tile.values) {
              for (let value of tile.values) {
                if (Array.isArray(value.textValues) && value.textValues.length && value.textValues[0].label) {
                  const match = value.textValues[0].label.match(/\s*\[\s*\[\s*(.*?)\s*\]\s*\]\s*/)
                  if (match) {
                    const overlayType = match[1]
                    const lfoTargetMatch = overlayType.match(/lfo([\d])Target/)

                    if (overlayType == 'devices') {
                      if (config.devices) {
                        value.textValues = [{
                          index: 0,
                          label: 'Unknown',
                          value: 0,
                        }]
                        let idx = value.textValues.length

                        const deviceKeys = Object.keys(config.devices).filter( deviceKey => deviceKey != 'bacara' )
                        deviceKeys.unshift('bacara')

                        for (let deviceKey of deviceKeys) {
                          let instance = config.devices[deviceKey].instance ? config.devices[deviceKey].instance : 'ch.#'
                          const model = config.devices[deviceKey].model
                          const short = config.devices[deviceKey].short

                          if (Array.isArray(config.devices[deviceKey].channels)) {
                            for (let c in config.devices[deviceKey].channels) {
                              if (Array.isArray(config.devices[deviceKey].instances) && config.devices[deviceKey].instances.length > c) {
                                instance = config.devices[deviceKey].instances[c]
                              }
                              if (typeof config.devices[deviceKey].special === 'object' && config.devices[deviceKey].special[config.devices[deviceKey].channels[c]]) {
                                instance = config.devices[deviceKey].special[config.devices[deviceKey].channels[c]]
                              }
                              const label = config.devices[deviceKey].channels.length > 1 ? `${short ? short : model} ${instance}`.trim() : model
                              const rLabel = label.replace('#', config.devices[deviceKey].instance ? (parseInt(c) + 1) : config.devices[deviceKey].channels[c])

                              value.textValues.push({
                                index: idx,
                                label: rLabel.substr(0, 15),
                                value: idx,
                              })
                              idx++
                            }
                          }
                        }
                      }
                    } else if (overlayType == 'ports') {
                      if (config.devices) {
                        value.textValues = []
                        let idx = value.textValues.length

                        for (let port of Bacara.getPresetState('midi.ports.output', [])) {
                          value.textValues.push({
                            index: idx,
                            label: port.short.substr(0, 15),
                            value: idx,
                          })
                          idx++
                        }
                      }
                    } else if (overlayType == 'matrixSrce') {
                      value.textValues = [
                        {
                          index: 0,
                          label: 'Off',
                          value: 0,
                        },
                        {
                          index: 1,
                          label: 'Mod WHeel',
                          value: 1,
                        },
                        {
                          index: 2,
                          label: 'Velocity',
                          value: 2,
                        },
                        {
                          index: 3,
                          label: 'Ch.Aftertouch',
                          value: 3,
                        },
                      ]
                      for (let cc = 2; cc <= 127; cc++) {
                        value.textValues.push({
                          index: 3 + cc,
                          label: `CC #${cc}`,
                          value: 3 + cc,
                        })
                      }
                      let idx = value.textValues.length
                      for (let addr in torsoT1OSC) {
                        if (torsoT1OSC[addr].matrix) {
                          value.textValues.push({
                            index: idx,
                            label: 'T-1 OSC ' + titleCase(addr.substr(4)),
                            value: idx++,
                          })
                        }
                      }
                    } else if (overlayType == 'matrixTarget') {
                      value.textValues = [{
                        index: 0,
                        label: 'Off',
                        value: 0,
                      }]
                      let idx = value.textValues.length
                      for (let ctrl = 1; ctrl < 128; ctrl++) {
                        const path = interface.getMapPath('external', 'cc', ctrl)
                        /*                 debug('path %y %y %y',path,`^lfo.${currentLfo-1}.`,path && path.match(`^lfo.${currentLfo-1}.`))*/
                        if (path) {
                          value.textValues.push({
                            index: idx++,
                            label: interface.getElementAttribute(path, 'name'),
                            value: ctrl,
                          })
                        }
                      }
                    } else if (lfoTargetMatch) {
                      const currentLfo = parseInt(lfoTargetMatch[1])
                      value.textValues = [{
                        index: 0,
                        label: 'Off',
                        value: 0,
                      }]
                      let idx = value.textValues.length
                      for (let ctrl = 1; ctrl < 128; ctrl++) {
                        value.textValues.push({
                          index: idx++,
                          label: `Control #${ctrl}`,
                          value: ctrl + 128,
                        })
                      }
                      /*                debug('map %y',interface.map)*/
                      for (let ctrl = 1; ctrl < 128; ctrl++) {
                        const path = interface.getMapPath('external', 'cc', ctrl)
                        /*                 debug('path %y %y %y',path,`^lfo.${currentLfo-1}.`,path && path.match(`^lfo.${currentLfo-1}.`))*/
                        if (path && !path.match(`^lfo.${currentLfo - 1}.`)) {
                          value.textValues.push({
                            index: idx++,
                            label: interface.getElementAttribute(path, 'name'),
                            value: ctrl,
                          })
                        }
                      }
                      /*               debug('hi %y %y', lfoTargetMatch,overlay)*/
                    } else if (overlayType == 'axyzTarget') {
                      value.textValues = [{
                        index: 0,
                        label: 'Off',
                        value: 0,
                      }]
                      let idx = value.textValues.length
                      const list = devices['virus-ti'].flatList
                      for (let ctrl = 0; ctrl < list.length; ctrl++) {
                        const path = list[ctrl]
                        if (path) {
                          value.textValues.push({
                            index: idx++,
                            label: path.replace(/\./g, ' '),
                            value: ctrl + 1,
                          })
                        }
                      }
                    } else if (overlayType == 'virusBank') {

                      value.textValues = []

                      let idx = value.textValues.length
                      for (let i = 0; i < 4; i++) {
                        value.textValues.push({
                          index: idx,
                          label: `RAM ${String.fromCharCode('A'.charCodeAt(0) + i)}`,
                          value: idx,
                        })
                        idx++
                      }
                      for (let i = 0; i < 26; i++) {
                        value.textValues.push({
                          index: idx,
                          label: `ROM ${String.fromCharCode('A'.charCodeAt(0) + i)}`,
                          value: idx,
                        })
                        idx++
                      }

                      const banks = virus.getBanks()
                      if (banks) {
                        for (let bank of banks) {
                          value.textValues.push({
                            index: idx,
                            label: bank.short,
                            value: idx,
                          })
                          idx++
                        }
                      }
                    } else {
                      console.error(`Unknown (and thus unhandled) overlay type "${overlayType}"`)
                    }
                  }
                }
              }
            }
          }
        }

        // For older .EPR preset files
        if (Array.isArray(preset.overlays)) {
          for (let overlay of preset.overlays) {
            if (Array.isArray(overlay.items) && overlay.items.length && overlay.items[0].label) {
              const match = overlay.items[0].label.match(/\s*\[\s*\[\s*(.*?)\s*\]\s*\]\s*/)
              if (match) {
                const overlayType = match[1]
                const lfoTargetMatch = overlayType.match(/lfo([\d])Target/)

                if (overlayType == 'devices') {
                  if (config.devices) {
                    overlay.items = [{
                      index: 0,
                      label: 'Unknown',
                      value: 0,
                    }]
                    let idx = overlay.items.length

                    const deviceKeys = Object.keys(config.devices).filter( deviceKey => deviceKey != 'bacara' )
                    deviceKeys.unshift('bacara')

                    for (let deviceKey of deviceKeys) {
                      let instance = config.devices[deviceKey].instance ? config.devices[deviceKey].instance : 'ch.#'
                      const model = config.devices[deviceKey].model
                      const short = config.devices[deviceKey].short

                      if (Array.isArray(config.devices[deviceKey].channels)) {
                        for (let c in config.devices[deviceKey].channels) {
                          if (Array.isArray(config.devices[deviceKey].instances) && config.devices[deviceKey].instances.length > c) {
                            instance = config.devices[deviceKey].instances[c]
                          }
                          if (typeof config.devices[deviceKey].special === 'object' && config.devices[deviceKey].special[config.devices[deviceKey].channels[c]]) {
                            instance = config.devices[deviceKey].special[config.devices[deviceKey].channels[c]]
                          }
                          const label = config.devices[deviceKey].channels.length > 1 ? `${short ? short : model} ${instance}`.trim() : model
                          const rLabel = label.replace('#', config.devices[deviceKey].instance ? (parseInt(c) + 1) : config.devices[deviceKey].channels[c])

                          overlay.items.push({
                            index: idx,
                            label: rLabel.substr(0, 15),
                            value: idx,
                          })
                          idx++
                        }
                      }
                    }
                  }
                } else if (overlayType == 'ports') {
                  if (config.devices) {
                    overlay.items = []
                    let idx = overlay.items.length

                    for (let port of Bacara.getPresetState('midi.ports.output', [])) {
                      overlay.items.push({
                        index: idx,
                        label: port.short.substr(0, 15),
                        value: idx,
                      })
                      idx++
                    }
                  }
                } else if (overlayType == 'matrixTarget') {
                  overlay.items = [{
                    index: 0,
                    label: 'Off',
                    value: 0,
                  }]
                  let idx = overlay.items.length
                  for (let ctrl = 1; ctrl < 128; ctrl++) {
                    const path = interface.getMapPath('external', 'cc', ctrl)
                    /*                 debug('path %y %y %y',path,`^lfo.${currentLfo-1}.`,path && path.match(`^lfo.${currentLfo-1}.`))*/
                    if (path) {
                      overlay.items.push({
                        index: idx++,
                        label: interface.getElementAttribute(path, 'name'),
                        value: ctrl,
                      })
                    }
                  }
                } else if (lfoTargetMatch) {
                  const currentLfo = parseInt(lfoTargetMatch[1])
                  overlay.items = [{
                    index: 0,
                    label: 'Off',
                    value: 0,
                  }]
                  let idx = overlay.items.length
                  for (let ctrl = 1; ctrl < 128; ctrl++) {
                    overlay.items.push({
                      index: idx++,
                      label: `Control #${ctrl}`,
                      value: ctrl + 128,
                    })
                  }
                  /*                debug('map %y',interface.map)*/
                  for (let ctrl = 1; ctrl < 128; ctrl++) {
                    const path = interface.getMapPath('external', 'cc', ctrl)
                    /*                 debug('path %y %y %y',path,`^lfo.${currentLfo-1}.`,path && path.match(`^lfo.${currentLfo-1}.`))*/
                    if (path && !path.match(`^lfo.${currentLfo - 1}.`)) {
                      overlay.items.push({
                        index: idx++,
                        label: interface.getElementAttribute(path, 'name'),
                        value: ctrl,
                      })
                    }
                  }
                  /*               debug('hi %y %y', lfoTargetMatch,overlay)*/
                } else if (overlayType == 'axyzTarget') {
                  overlay.items = [{
                    index: 0,
                    label: 'Off',
                    value: 0,
                  }]
                  let idx = overlay.items.length
                  const list = devices['virus-ti'].flatList
                  for (let ctrl = 0; ctrl < list.length; ctrl++) {
                    const path = list[ctrl]
                    if (path) {
                      overlay.items.push({
                        index: idx++,
                        label: path.replace(/\./g, ' '),
                        value: ctrl + 1,
                      })
                    }
                  }
                } else if (overlayType == 'virusBank') {

                  overlay.items = []

                  let idx = overlay.items.length
                  for (let i = 0; i < 4; i++) {
                    overlay.items.push({
                      index: idx,
                      label: `RAM ${String.fromCharCode('A'.charCodeAt(0) + i)}`,
                      value: idx,
                    })
                    idx++
                  }
                  for (let i = 0; i < 26; i++) {
                    overlay.items.push({
                      index: idx,
                      label: `ROM ${String.fromCharCode('A'.charCodeAt(0) + i)}`,
                      value: idx,
                    })
                    idx++
                  }

                  const banks = virus.getBanks()
                  if (banks) {
                    for (let bank of banks) {
                      overlay.items.push({
                        index: idx,
                        label: bank.short,
                        value: idx,
                      })
                      idx++
                    }
                  }
                } else {
                  console.error(`Unknown (and thus unhandled) overlay type "${overlayType}"`)
                }
              }
            }
          }
        }
      }
      if (options.filename) {
        jsonfile.writeFileSync(options.filename, preset, { flag: 'w', spaces: 2 })
        process.exit(0)
      } else {
        process.stdout.once('drain', () => process.exit(0) )
        process.stdout.write(JSON.stringify(preset, null, 2) + '\n')
      }
    } else {
      console.error(`The file "${options.template[options.focus]}" does not exist`)
    }
  } else {
    args.showHelp()
  }
}

module.exports = {
  setup(a) {
    args = a
  },
  name: 'preset',
  description: 'Generate Preset File (.eproj)',
  handler: generatePreset,
  examples: [
    {usage:'electra-one preset --filename <preset-file>', description:'Generates Preset File (.eproj) and outputs to filename'},
    {usage:'electra-one preset', description:'Generates Preset File (.eproj) and outputs to stdout'},
  ],
  aliases:[]
}