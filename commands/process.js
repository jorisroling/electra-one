const fs = require('fs-extra')
const jsonfile = require('jsonfile')
const _ = require('lodash')
const config = require('config')

let args

function preProcess(name, sub, options) {

  if (options.filename) {
    if (fs.existsSync(options.filename)) {
      const preset = jsonfile.readFileSync(options.filename)
      if (Array.isArray(preset.overlays)) {
        for (let overlay of preset.overlays) {
          if (Array.isArray(overlay.items) && overlay.items.length && overlay.items[0].label) {
            const match = overlay.items[0].label.match(/\s*\[\s*\[\s*(.*?)\s*\]\s*\]\s*/)
            if (match) {
              const overlayType = match[1]
              if (config.devices) {
                overlay.items = [{
                  value: 0,
                  label: 'Unknown',
                  index: 0,
                }]
                let idx=1
                for (let deviceKey in config.devices) {
                  let instance = config.devices[deviceKey].instance ? config.devices[deviceKey].instance : 'ch.#'
                  const model = config.devices[deviceKey].model

                  if (Array.isArray(config.devices[deviceKey].channels)) {
                    for (let c in config.devices[deviceKey].channels) {
                      if (Array.isArray(config.devices[deviceKey].instances) && config.devices[deviceKey].instances.length>c) {
                        instance = config.devices[deviceKey].instances[c]
                      }
                      const label = config.devices[deviceKey].channels.length>1?`${model} ${instance}`:model
                      const rLabel = label.replace('#',config.devices[deviceKey].instance?(parseInt(c)+1):config.devices[deviceKey].channels[c])

                      overlay.items.push({
                        value: idx,
                        label: rLabel,
                        index: idx,
                      })
                      idx++
                    }
                  }
                }
              }
            }
          }
        }
      }
      process.stdout.write(JSON.stringify(preset,null,2))
    } else {
      console.error(`The file "${options.filename}" does not exist`)
    }
  } else {
    args.showHelp()
  }
}

module.exports = {
  setup(a) {
    args = a
  },
  name: 'process',
  description: 'Pre Process Preset Files',
  handler: preProcess,
  examples: [
    {usage:'electra-one process --filename <preset-file>', description:'Pre-Process Preset File (.epr) and outputs to stdout'},
  ],
  aliases:[]
}