const _ = require('lodash')
const yves = require('../lib/yves')
const fs = require('fs-extra')
const path = require('path')
const jsonfile = require('jsonfile')

const { table } = require('table')
const chalk = require('chalk')
const labelColor = chalk.hex('#FF8800')

let args

function pageSwap(name, sub, options) {
/*  debug('Options %y',options)*/
/*  console.log(options)*/

  if (options.filename) {
    if (fs.existsSync(options.filename)) {
      const preset = jsonfile.readFileSync(options.filename)



      function showPages(title) {
        const data = [
          ['#','Page' + (title ? ` (${title})` : '')]
        ]
        for (let i = 0; i < preset.pages.length; i++) {
          data.push([labelColor(preset.pages[i].id),labelColor(preset.pages[i].name)])
        }
        const output = table(data, {})

        console.log(output)
      }


      /*      debug('preset %y',preset)*/
      if (Array.isArray(options.swap) && options.swap.length == 2 && options.swap[0] != options.swap[1] && parseInt(options.swap[0]) > 0 && parseInt(options.swap[0]) <= 12 && parseInt(options.swap[1]) > 0 && parseInt(options.swap[1]) <= 12) {
        const pageA = (parseInt(options.swap[0]) < parseInt(options.swap[1])) ? parseInt(options.swap[0]) : parseInt(options.swap[1])
        const pageB = (parseInt(options.swap[0]) < parseInt(options.swap[1])) ? parseInt(options.swap[1]) : parseInt(options.swap[0])
        debug('swap page %y <=> %y',pageA,pageB)
        preset.name += ` - Swapped ${pageA} & ${pageB}`
        const tmp = preset.pages[pageA - 1]
        preset.pages[pageA - 1] = preset.pages[pageB - 1]
        preset.pages[pageB - 1] = tmp
        preset.pages[pageA - 1].id = pageA
        preset.pages[pageB - 1].id = pageB
        for (let g in preset.groups) {
          if (preset.groups[g].pageId == pageA) {
            preset.groups[g].pageId = pageB
          } else if (preset.groups[g].pageId == pageB) {
            preset.groups[g].pageId = pageA
          }
        }
        for (let c in preset.controls) {
          if (preset.controls[c].pageId == pageA) {
            preset.controls[c].id += (pageB - pageA) * 36
            preset.controls[c].pageId = pageB

          } else if (preset.controls[c].pageId == pageB) {
            preset.controls[c].id -= (pageB - pageA) * 36
            preset.controls[c].pageId = pageA
          }
        }

        showPages('new')
        const parsed = path.parse(options.filename)
        delete parsed.base
        parsed.name += '.swap'
        const newFilename = path.format(parsed)
        jsonfile.writeFileSync(newFilename, preset, { flag: 'w', spaces: 2 })
        debug('writen: %y',newFilename  )
      } else {
        showPages()
      }
    } else {
      console.error('Unable to load preset "%s"',options.filename)
    }
  } else {
    args.showHelp()
  }
}

module.exports = {
  setup(a) {
    args = a
  },
  name: 'page',
  description: 'Swap pages',
  handler: pageSwap,
  aliases:[]
}