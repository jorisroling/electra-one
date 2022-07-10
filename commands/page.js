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
//  debug('Options %y',options)

  if (options.filename) {
    if (fs.existsSync(options.filename)) {
      const preset = jsonfile.readFileSync(options.filename)



      function showPages(title) {
        const data = [
          ['#', 'Page' + (title ? ` (${title})` : '')]
        ]
        for (let i = 0; i < preset.pages.length; i++) {
          data.push([labelColor(preset.pages[i].id), labelColor(preset.pages[i].name)])
        }
        const output = table(data, {})

        console.log(output)
      }


      if (sub[0] == 'list') {
        showPages()
      } else if (sub[0] == 'copy') {
        /*      debug('preset %y',preset)*/
        if (Array.isArray(options.page) && options.page.length == 2 && options.page[0] != options.page[1] && parseInt(options.page[0]) > 0 && parseInt(options.page[0]) <= 12 && parseInt(options.page[1]) > 0 && parseInt(options.page[1]) <= 12) {
          const sourcePage = parseInt(options.page[0])
          const targetPage = parseInt(options.page[1])
          const pageA = (parseInt(options.page[0]) < parseInt(options.page[1])) ? parseInt(options.page[0]) : parseInt(options.page[1])
          const pageB = (parseInt(options.page[0]) < parseInt(options.page[1])) ? parseInt(options.page[1]) : parseInt(options.page[0])
          debug('copy page %y => %y', sourcePage, targetPage)
          preset.name += ` - Copied ${sourcePage} to ${targetPage}`

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
          debug('writen: %y', newFilename  )
          //        } else {
          // empty
        }
      } else if (sub[0] == 'swap') {
        /*      debug('preset %y',preset)*/
        if (Array.isArray(options.page) && options.page.length == 2 && options.page[0] != options.page[1] && parseInt(options.page[0]) > 0 && parseInt(options.page[0]) <= 12 && parseInt(options.page[1]) > 0 && parseInt(options.page[1]) <= 12) {
          const pageA = (parseInt(options.page[0]) < parseInt(options.page[1])) ? parseInt(options.page[0]) : parseInt(options.page[1])
          const pageB = (parseInt(options.page[0]) < parseInt(options.page[1])) ? parseInt(options.page[1]) : parseInt(options.page[0])
          debug('swap page %y <=> %y', pageA, pageB)
          preset.name += ` - Swapped ${pageA} & ${pageB}`

          let pageAidx
          let pageBidx
          for (let idx = 0; idx < 12; idx++) {
            if (idx < preset.pages.length) {
              if (preset.pages[idx].id == (pageA - 1)) {
                pageAidx = idx + 1
              }
              if (preset.pages[idx].id == (pageB - 1)) {
                pageBidx = idx + 1
              }
            }
          }

          if (!pageAidx || !pageBidx) {
            console.error(`Unknown Page (either ${pageA} or ${pageB})`)
            process.exit(0)
          }

          const tmp = preset.pages[pageAidx - 1]
          preset.pages[pageAidx - 1] = preset.pages[pageBidx - 1]
          preset.pages[pageBidx - 1] = tmp
          preset.pages[pageAidx - 1].id = pageA
          preset.pages[pageBidx - 1].id = pageB
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
          debug('writen: %y', newFilename  )
        } else {
          console.log(options)
          console.error('--page options not OK')
        }
      } else {
        args.showHelp()
      }
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
  name: 'page',
  description: 'Operates on pages in a Preset File (.eproj), possible subcommands: list, copy, swap',
  examples: [
    {usage:'electra-one page list --filename ./preset.eproj', description:'List all pages in a Preset File (.eproj)'},
    //    {usage:'electra-one page copy --page 1 --page 2 --filename ./preset.eproj', description:'Copy a page to a new position in a Preset File (.eproj)'},
    {usage:'electra-one page swap --page 1 --page 2 --filename ./preset.eproj', description:'Swap two pages in a Preset File (.eproj)'},
  ],
  handler: pageSwap,
  aliases:[]
}