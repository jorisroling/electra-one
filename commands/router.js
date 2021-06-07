const sleep = require('sleep')
const yves = require('../lib/yves')
const _ = require('lodash')
const config = require('config')
const os = require('os')
const fs = require('fs-extra')
const path = require('path')
const untildify = require('untildify')
const jsonfile = require('jsonfile')

const Midi = require('../lib/midi/midi')

const electraOneMidiChannel = 0
const sendProgramChangeTimeoutTime = 0 // 200
const sendSingleRequestTimeoutTime = 0 // 200
const sendSingleDumpTimeoutTime = 0 // 600

const pkg = require('../package.json')
const debugPart = yves.debugger(`${pkg.name.replace(/^@/, '')}:part`)

let mapping = {
  'part': 1,
}

function setMapping(key, value) {
  mapping[key] = value
  writeState()
}

function getMapping(key) {
  const pair = key.split(':')
  const mapped = mapping[pair[0]]
  switch (pair[1]) {
  case '+1':
    return mapped + 1
  case '-1':
    return mapped - 1
  default:
    return mapped
  }
}

function doMapping(bytes) {
  return bytes.map( byte => (typeof byte == 'string') ? getMapping(byte) : byte )
}


function readState() {
  const filePath = path.resolve((process.env.NODE_ENV == 'production') ? untildify('~/.electra-one/state/router.json') : `${__dirname}/../state/router.json`)
  if (fs.existsSync(filePath)) {
    const state = jsonfile.readFileSync(filePath)
    if (state.mapping) {
      mapping = state.mapping
    }
  }
}



function writeState() {
  const filePath = path.resolve((process.env.NODE_ENV == 'production') ? untildify('~/.electra-one/state/router.json') : `${__dirname}/../state/router.json`)
  fs.ensureDirSync(path.dirname(filePath))
  const state = { mapping }
  jsonfile.writeFileSync(filePath, state, { flag: 'w', spaces: 2 })
}



const midiHistory = {}

function handleIncoming(from, to, targetElectraOne, options) {
  return (msg) => {
    //       debug('handleIncoming: %s %y',from,msg)

    switch (msg._type) {
    case 'program':
      if (options.channels.indexOf(msg.channel + 1) >= 0) {
        if (options.portMap == 'virus-ti') {
          if ((targetElectraOne && msg.channel == getMapping('part:-1')) || (!targetElectraOne && msg.channel == electraOneMidiChannel) ) {
            _.set(midiHistory, `${from}.channel_${getMapping('part:-1')}.program`, msg.number)
            Midi.send(to, 'program', {channel: targetElectraOne ? electraOneMidiChannel : getMapping('part:-1'), number: msg.number},'programChange',sendProgramChangeTimeoutTime)
            debugPart('Part mapping %y applied to PC %d to %y', (targetElectraOne ? (electraOneMidiChannel + 1) : getMapping('part')), msg.number, to)
            Midi.send(to, 'sysex', [0xF0, 0x00, 0x20, 0x33, 0x01, 0x00, 0x30, 0x00, getMapping('part:-1'), 0xF7], 'singleRequest', sendSingleRequestTimeoutTime)
          }
        } else {
          debug('Forwarding PC %d on channel %d to %y', msg.number, msg.channel + 1, to)
          Midi.send(to, 'cc', msg)
        }
      }
      break
    case 'cc':
      if (options.channels.indexOf(msg.channel + 1) >= 0) {
        if (options.portMap == 'virus-ti') {
          if ((targetElectraOne && msg.channel == getMapping('part:-1')) || (!targetElectraOne && msg.channel == electraOneMidiChannel) ) {
            if (msg.controller == 6 || msg.controller == 38 || msg.controller == 98 || msg.controller == 99) { // NRPN
              //                debug('NRPN %y=%y',msg.controller,msg.value)
              _.set(midiHistory, `${from}.channel_${getMapping('part:-1')}.controller_${msg.controller}`, msg.value)
              //                debug('midiHistory %y',midiHistory)
              if (msg.controller == 6 && _.get(midiHistory, `${from}.channel_${getMapping('part:-1')}.controller_99`) == 7 &&  _.get(midiHistory, `${from}.channel_${getMapping('part:-1')}.controller_98`) == 104 ) {
                const pitch = (_.get(midiHistory, `${from}.channel_${getMapping('part:-1')}.controller_6`) << 0) | (_.get(midiHistory, `${from}.channel_${getMapping('part:-1')}.controller_38`) << 7)
                debug('Pitch %y to %y', pitch - 8192, to)
                Midi.send(to, 'pitch', {value: pitch, channel: targetElectraOne ? electraOneMidiChannel : getMapping('part:-1')})
              }
            } else {
              Midi.send(to, 'cc', {channel: targetElectraOne ? electraOneMidiChannel : getMapping('part:-1'), controller: msg.controller, value: msg.value})
              debugPart('Part mapping %y applied to CC %d (value %d) to %y', (targetElectraOne ? (electraOneMidiChannel + 1) : getMapping('part')), msg.controller, msg.value, to)
              if (msg.controller == 0 && _.get(midiHistory, `${from}.channel_${getMapping('part:-1')}.program`, -1) >= 0) {
                debug('Bank: %y to %y', msg.value, to)
                Midi.send(to, 'program', {channel: targetElectraOne ? electraOneMidiChannel : getMapping('part:-1'), number: _.get(midiHistory, `${from}.channel_${getMapping('part:-1')}.program`)},'programChange',sendProgramChangeTimeoutTime)
                debugPart('Part mapping %y applied to PC %d to %y', (targetElectraOne ? (electraOneMidiChannel + 1) : getMapping('part')), _.get(midiHistory, `${from}.channel_${getMapping('part:-1')}.program`), to)
                Midi.send(to, 'sysex', [0xF0, 0x00, 0x20, 0x33, 0x01, 0x00, 0x30, 0x00, getMapping('part:-1'), 0xF7], 'singleRequest', sendSingleRequestTimeoutTime)

              }
            }
          }
        } else {
          debug('Forwarding CC %d (value %d) on channel %d to %y', msg.controller, msg.value, msg.channel + 1, to)
          Midi.send(to, 'cc', msg)
        }
      }
      break
    case 'sysex':
      if (options.portMap == 'virus-ti' && msg.bytes) {

        /* Query Part Change Custom SysEx */
        if (msg.bytes.length == 5 && msg.bytes[0] == 0xF0 && msg.bytes[1] == 0x7D && msg.bytes[2] == 0x21 && msg.bytes[3] == 0xF7) {
          debug('Get mapped part: %y by %y', getMapping('part'), from)
          Midi.send(from, 'sysex', [0xF0, 0x7D, 0x20, getMapping('part'), 0xF7])

        /* Part Change Custom SysEx */
        } else if (msg.bytes.length == 5 && msg.bytes[0] == 0xF0 && msg.bytes[1] == 0x7D && msg.bytes[2] == 0x20 && msg.bytes[4] == 0xF7) {
          setMapping('part', msg.bytes[3])
          debug('Set mapped part: %y by %y', getMapping('part'), from)
          Midi.send(to, 'sysex', [0xF0, 0x00, 0x20, 0x33, 0x01, 0x00, 0x30, 0x00, getMapping('part:-1'), 0xF7], 'singleRequest', sendSingleRequestTimeoutTime)

          /* Single SysEx Parameterchange F0 00 20 33 01 XX (6E - 72) YY */
        } else if (msg.bytes.length == 11 && msg.bytes[0] == 0xF0 && msg.bytes[1] == 0x00 && msg.bytes[2] == 0x20 && msg.bytes[3] == 0x33 && msg.bytes[4] == 0x01 /* &&  msg.bytes[5]==0x00 */ && msg.bytes[6] >= 0x6E && msg.bytes[6] <= 0x73 && msg.bytes[7] == (targetElectraOne ? getMapping('part:-1') : electraOneMidiChannel) && msg.bytes[10] == 0xF7) {
          const page = String.fromCharCode(65 + ((msg.bytes[6] + (msg.bytes[6] < 0x70 ? 4 /* 5 */ : (msg.bytes[6] > 0x71 ? 2 : 0)) ) - 0x70 ) )
          let info = `page ${page} parameter ${msg.bytes[8]} (0x${msg.bytes[8].toString(16).toUpperCase()}) value ${msg.bytes[9]}`

          // F0 00 20 33 01 XX 72 00  21 32 F7 => preset change from virus-ti
          // F0 00 20 33 01 XX 72 00  20 1A F7 => bank change from virus-ti
          if (msg.bytes[6] == 0x72 && (msg.bytes[8] == 0x20 || msg.bytes[8] == 0x21)) {
            debug('Patch or Bank change, Single Request back')
            Midi.send(from, 'sysex', [0xF0, 0x00, 0x20, 0x33, 0x01, 0x00, 0x30, 0x00, getMapping('part:-1'), 0xF7], 'singleRequest', sendSingleRequestTimeoutTime)


            if (targetElectraOne) {
              if (msg.bytes[8] == 0x20) {
                debug('CC0')
                Midi.send(to, 'cc', {channel:electraOneMidiChannel, controller:0, value:msg.bytes[9]})
              } else if (msg.bytes[8] == 0x21) {
                debug('PC')
                Midi.send(to, 'program', {channel:electraOneMidiChannel, number:msg.bytes[9]})
              }
            }
            // F0 00 20 33 01 XX 72 01  1D 02 F7
          } else if (msg.bytes[6] == 0x72 && msg.bytes[8] == 0x1D) {
            debug('Part change (to %y), Single Request back', msg.bytes[7] + 1)
            setMapping('part', msg.bytes[7] + 1)
            Midi.send(to, 'sysex', [0xF0, 0x7D, 0x20, getMapping('part'), 0xF7])
            Midi.send(from, 'sysex', [0xF0, 0x00, 0x20, 0x33, 0x01, 0x00, 0x30, 0x00, getMapping('part:-1'), 0xF7], 'singleRequest', sendSingleRequestTimeoutTime)

          } else {
            msg.bytes[7] = ( targetElectraOne ? electraOneMidiChannel : getMapping('part:-1') )
            debugPart('Part mapping %y applied %s to SysEx Parameterchange to %y', msg.bytes[7] + 1, info, to)
            Midi.send(to, 'sysex', msg.bytes)
          }

          /* Single Request F0 00 20 33 01 XX 30 00 YY */
        } else if (msg.bytes.length == 11 && msg.bytes[0] == 0xF0 && msg.bytes[1] == 0x00 && msg.bytes[2] == 0x20 && msg.bytes[3] == 0x33 && msg.bytes[4] == 0x01 /* &&  msg.bytes[5]==0x00 */ && msg.bytes[6] >= 0x6E && msg.bytes[6] <= 0x72 && msg.bytes[10] == 0xF7) {
          if (msg.bytes[6] == 0x72 && msg.bytes[8] == 0x1D) {
            debug('Part change to %y, Single Request back', msg.bytes[9] + 1)
            setMapping('part', msg.bytes[9] + 1)
            Midi.send(to, 'sysex', [0xF0, 0x7D, 0x20, getMapping('part'), 0xF7])
            Midi.send(from, 'sysex', [0xF0, 0x00, 0x20, 0x33, 0x01, 0x00, 0x30, 0x00, getMapping('part:-1'), 0xF7], 'singleRequest', sendSingleRequestTimeoutTime)

          }
        } else if (msg.bytes.length == 10 && msg.bytes[0] == 0xF0 && msg.bytes[1] == 0x00 && msg.bytes[2] == 0x20 && msg.bytes[3] == 0x33 && msg.bytes[4] == 0x01 /* &&  msg.bytes[5]==0x00 */ && msg.bytes[6] == 0x30 && msg.bytes[7] == 0x00 /* && msg.bytes[8]==0x00 */) {
          msg.bytes[8] = ( targetElectraOne ? electraOneMidiChannel : getMapping('part:-1') )
          debugPart('Part mapping %y applied to Single Request SysEx to %y', msg.bytes[8], to)
          Midi.send(to, 'sysex', [0xF0, 0x00, 0x20, 0x33, 0x01, 0x00, 0x30, 0x00, getMapping('part:-1'), 0xF7], 'singleRequest', sendSingleRequestTimeoutTime)

          /* Single Dump Buffer F0 00 20 33 01 XX 10 00 YY */
        } else if (msg.bytes.length == 524 && msg.bytes[0] == 0xF0 && msg.bytes[1] == 0x00 && msg.bytes[2] == 0x20 && msg.bytes[3] == 0x33 && msg.bytes[4] == 0x01 /* &&  msg.bytes[5]==0x00 */ && msg.bytes[6] == 0x10 && msg.bytes[7] == 0x00 /* && msg.bytes[8]==0x00 */ ) {
          msg.bytes[8] = ( targetElectraOne ? electraOneMidiChannel : getMapping('part:-1'))
          debugPart('Part mapping %y applied to Single Dump SysEx to %y', msg.bytes[8] + 1, to)
          debug('Send large sysex to %y (%y bytes)',to,msg.bytes.length)
          Midi.send(to, 'sysex', msg.bytes, 'singleDump', sendSingleDumpTimeoutTime)

        } else if (msg.bytes.length == 11 && msg.bytes[0] == 0xF0 && msg.bytes[1] == 0x00 && msg.bytes[2] == 0x20 && msg.bytes[3] == 0x33 && msg.bytes[4] == 0x01 /* &&  msg.bytes[5]==0x00 */ && msg.bytes[6] == 0x72 && msg.bytes[7] == 0x00 ) {
          // F0 00 20 33 01 XX 72 00  21 32 F7 => preset change
          // F0 00 20 33 01 XX 72 00  20 1A F7 => bank change
          debug('PC')
          Midi.send(to, 'sysex', [0xF0, 0x00, 0x20, 0x33, 0x01, 0x00, 0x30, 0x00, getMapping('part:-1'), 0xF7], 'singleRequest', sendSingleRequestTimeoutTime)


        }
      } else { /* Anything else */
        debug('Forwarding SysEx to %y', to)
        Midi.send(to, 'sysex', msg.bytes)
      }
      break
    default:
      // Do nothing
      break
    }
  }
}

function setupMidi(options) {
  const scenario = _.get(config, `router.scenarios.${options.scenario}`)
  if (scenario && scenario.actors) {
    const actors = Object.keys(scenario.actors)
    for (const actor of actors) {
      if (scenario.actors[actor].enabled && scenario.actors[actor].port && scenario.actors[actor].channels && scenario.actors[actor].channels.length) {
        const electraOnePortName = `electra-one-${scenario.actors[actor].port}`
        const midiInput_electraOne = Midi.input(electraOnePortName, true)
        midiInput_electraOne.on('message', handleIncoming(electraOnePortName, actor, false, scenario.actors[actor]) )

        if (!scenario.actors[actor].oneway) {
          const midiInput_actor = Midi.input(actor, true)
          midiInput_actor.on('message', handleIncoming(actor, electraOnePortName, true, scenario.actors[actor]) )
        }

        if (scenario.actors[actor].initialize) {
          for (const init in scenario.actors[actor].initialize) {
            Midi.send(init, 'sysex', doMapping(scenario.actors[actor].initialize[init]))
          }
        }
      }
    }
  } else {
    console.error(`Unknown scenario "${options.scenario}"`)
  }
}

function routerConsole(name, sub, options) {
  //Midi.setupVirtualPorts()

  readState()
  setupMidi(options)
}

module.exports = {
  name: 'router',
  description: 'Start router for Electra One <-> Devices defined in the scenario',
  examples: [
    {usage:'electra-one router', description:'Starts router with default scenario'},
    {usage:'electra-one router --scenario studio', description:'Starts router with scenario "studio"'},
  ],
  handler: routerConsole,
}
