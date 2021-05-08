const yves = require('../lib/yves')
const pkg = require('../package.json')
const debugMidi = yves.debugger(`${pkg.name.replace(/^@/,'').replace(/[/-]+/g,':')}:midi`)
const debugMidiNoteOn = yves.debugger(`${pkg.name.replace(/^@/,'').replace(/[/-]+/g,':')}:midi:note:on`)
const debugMidiNoteOff = yves.debugger(`${pkg.name.replace(/^@/,'').replace(/[/-]+/g,':')}:midi:note:off`)
const debugMidiControlChange = yves.debugger(`${pkg.name.replace(/^@/,'').replace(/[/-]+/g,':')}:midi:control:change`)
const debugMidiProgramChange = yves.debugger(`${pkg.name.replace(/^@/,'').replace(/[/-]+/g,':')}:midi:program:change`)

const deepEqual = require('deep-equal')
//const Sequencer = require('../lib/sequencer')
//const Grid = require('../lib/grid')

const easymidi = require('easymidi')

const Acid = require('../lib/acid')

const Bacara = require('../lib/bacara')

const Midi = require('../lib/midi')

const _ = require('lodash')
const config = require('config')
const fs = require('fs')
const jsonfile = require('jsonfile')

const getRandomInt = (max) => Math.floor(Math.random() * Math.floor(max + 1))

/*const ShutdownHook = require('shutdown-hook')
const shutdownHook = new ShutdownHook()
shutdownHook.register()
*/
const euclideanRhythms = require('euclidean-rhythms')

const scaleMappings = require('../extra/scales/scales.json')

const { deviceCCs } = require('../lib/devices')

const typhonCCs = deviceCCs('typhon')
const virusCCs = deviceCCs('virus')

const shapes = ['sine','triangle','saw-up','saw-down','square','random']

let output
const deviceChannels = {  // 1-based channels
  A: 1,
  B: 2,
}

const notesSend = []

let midiInputName
let midiOutputName

let pulses = 0
let steps = 0

let time
let pulseDuration = 0

let writeState = true

class State {
  constructor() {
    this.values = {}

    this.values.playing = false
    this.values.pattern = null
    this.values.lastBut = 0

    this.values.size = 16
    this.values.page = 0

    this.reset(false)
    this.read()
    this.sendProgramChange('A')
    this.sendProgramChange('B')

    if (!this.values.pattern) {
      this.values.pattern = Acid.generate(this)
    }
  }

  reset(write = true) {
    this.values.temperature = 1.0
    this.values.transpose = 0
    this.values.gate = 1.0
    this.values.chance = 0
    this.values.octaves = []
    this.values.density = 100
    this.values.sounding = []
    this.values.killSteps = 0
    this.values.killShift = 1
    this.values.scales = 0
    this.values.base = 0
    this.values.shift = 0
    this.values.split = 127
    this.values.deviate = 0
    this.values.lfo = [
      {
        device: {
          A: 0,
          B: 0,
        },
        control: 0,
        shape: 0,
        shapeName: 'sine',
        rate: 64,
        phase: 0,
        amount: 0,
        offset: 50,
        density: 0,
      },
      {
        device: {
          A: 0,
          B: 0,
        },
        control: 0,
        shape: 0,
        shapeName: 'sine',
        rate: 64,
        phase: 0,
        amount: 0,
        offset: 50,
        density: 0,
      },
      {
        device: {
          A: 0,
          B: 0,
        },
        control: 0,
        shape: 0,
        shapeName: 'sine',
        rate: 64,
        phase: 0,
        amount: 0,
        offset: 50,
        density: 0,
      }
    ]
    this.values.device = {
      A: {
        port: 0,
        portName: null,
        channel: 1,
        bank: 0,
        program: 0,
      },
      B: {
        port: 0,
        portName: null,
        channel: 1,
        bank: 0,
        program: 0,
      },
    }

    this.genOctaves()
    this.genSounding()
    if (write) {
      this.write()
    }
  }

  get page() {
    return this.values.page
  }
  set page(value) {
    if (!deepEqual(this.values.page,value,{strict:true})) {
      this.values.page = value
      this.write()

      const midiOutput = Midi.output(midiOutputName,true)
      if (midiOutput) {
        midiOutput.send('program',{channel:config.acid.channel - 1,number:this.page})
      }
      this.sendValues()
    }
  }

  get playing() {
    return this.values.playing
  }
  set playing(value) {
    if (!deepEqual(this.values.playing,value,{strict:true})) {
      this.values.playing = value
      this.write()
    }
  }

  get pattern() {
    return this.values.pattern
  }
  set pattern(value) {
    if (!deepEqual(this.values.pattern,value,{strict:true})) {
      this.values.pattern = value
      this.write()
    }
  }

  get lastBut() {
    return this.values.lastBut
  }
  set lastBut(value) {
    if (!deepEqual(this.values.lastBut,value,{strict:true})) {
      this.values.lastBut = value
      this.write()
    }
  }

  get size() {
    return this.values.size
  }
  set size(value) {
    if (!deepEqual(this.values.size,value,{strict:true})) {
      this.values.size = value
      this.write()
    }
  }

  get temperature() {
    return this.values.temperature
  }
  set temperature(value) {
    if (!deepEqual(this.values.temperature,value,{strict:true})) {
      this.values.temperature = value
      this.write()
    }
  }

  get transpose() {
    return this.values.transpose
  }
  set transpose(value) {
    if (!deepEqual(this.values.transpose,value,{strict:true})) {
      this.values.transpose = value
      this.write()
    }
  }

  get gate() {
    return this.values.gate
  }
  set gate(value) {
    if (!deepEqual(this.values.gate,value,{strict:true})) {
      this.values.gate = value
      this.write()
    }
  }

  get chance() {
    return this.values.chance
  }
  set chance(value) {
    if (!deepEqual(this.values.chance,value,{strict:true})) {
      this.values.chance = value
      this.genOctaves(this.chance)
      this.write()
    }
  }

  get octaves() {
    return this.values.octaves
  }
  set octaves(value) {
    if (!deepEqual(this.values.octaves,value,{strict:true})) {
      this.values.octaves = value
      this.write()
    }
  }

  get density() {
    return this.values.density
  }
  set density(value) {
    if (!deepEqual(this.values.density,value,{strict:true})) {
      this.values.density = value
      this.genSounding(this.density)
      this.write()
    }
  }

  get sounding() {
    return this.values.sounding
  }
  set sounding(value) {
    if (!deepEqual(this.values.sounding,value,{strict:true})) {
      this.values.sounding = value
      this.write()
    }
  }

  get killSteps() {
    return this.values.killSteps
  }
  set killSteps(value) {
    if (!deepEqual(this.values.killSteps,value,{strict:true})) {
      this.values.killSteps = value
      this.write()
    }
  }

  get killShift() {
    return this.values.killShift
  }
  set killShift(value) {
    if (!deepEqual(this.values.killShift,value,{strict:true})) {
      this.values.killShift = value
      this.write()
    }
  }

  get scales() {
    return this.values.scales
  }
  set scales(value) {
    if (!deepEqual(this.values.scales,value,{strict:true})) {
      this.values.scales = value
      this.write()
    }
  }

  get base() {
    return this.values.base
  }
  set base(value) {
    if (!deepEqual(this.values.base,value,{strict:true})) {
      this.values.base = value
      this.write()
    }
  }

  get shift() {
    return this.values.shift
  }
  set shift(value) {
    if (!deepEqual(this.values.shift,value,{strict:true})) {
      this.values.shift = value
      this.write()
    }
  }

  get split() {
    return this.values.split
  }
  set split(value) {
    if (!deepEqual(this.values.split,value,{strict:true})) {
      this.values.split = value
      this.write()
    }
  }

  get deviate() {
    return this.values.deviate
  }
  set deviate(value) {
    if (!deepEqual(this.values.deviate,value,{strict:true})) {
      this.values.deviate = value
      this.write()
    }
  }

  get lfo() {
    return this.values.lfo
  }
  set lfo(value) {
    if (!deepEqual(this.values.lfo,value,{strict:true})) {
      this.values.lfo = value
      this.write()
    }
  }

  get device() {
    return this.values.device
  }
  set device(value) {
    if (!deepEqual(this.values.device,value,{strict:true})) {
      this.values.device = value
      this.write()
    }
  }


  read() {
    const filePath = `${__dirname}/../state/acid.json`
    if (fs.existsSync(filePath)) {
      const state = jsonfile.readFileSync(filePath)
      const keys = Object.keys(this.values)
      for (let k in keys) {
        if (Object.prototype.hasOwnProperty.call(state,keys[k])) {
          this.values[keys[k]] = state[keys[k]]
        }
      }
    }
  }

  write(quiet = false) {
    jsonfile.writeFileSync(`${__dirname}/../state/acid.json`, this.values, { flag: 'w', spaces: 2 })
    if (!quiet) {
      Acid.table(this)
    }
  }


  genOctaves() {
    for (let idx = 0; idx < 16; idx++) {
      const rnd = getRandomInt(100)
      const octave = (Math.abs(this.chance) > rnd)
      this.values.octaves[idx] = (octave ? (this.values.chance > 0 ? 1 : -1) : 0)
    }
  }

  genSounding() {
    for (let idx = 0; idx < 16; idx++) {
      const rnd = getRandomInt(100)
      this.values.sounding[idx] = (this.values.density && (this.values.density >= rnd)) ? 1 : 0
    }
  }

  euclidian(killSteps, steps, killShift) {
    function arrayRotate(arr, reverse) {
      if (reverse) {
        arr.unshift(arr.pop())
      } else {
        arr.push(arr.shift())
      }
      return arr
    }
    let pat = euclideanRhythms.getPattern(killSteps,steps)
    if (killShift) {
      let p = Math.abs(killShift)
      while (--p) {
        pat = arrayRotate(pat,killShift > 0)
      }
    }
    for (let idx = 0; idx < 16; idx++) {
      this.values.sounding[idx] = !pat[idx] ? 1 : 0
    }
    return pat
  }

  sendValues() {
    switch (this.page) {
    case 0x00: // ACID Main
      this.sendMainValues()
      break;
    case 0x01: // ACID LFO
      this.sendLFOValues()
      break;
    case 0x02: // ACID Program
      this.sendProgramValues()
      break;
    }
  }

  sendTopValues() {
    sendNRPN(midiOutputName,config.acid.temperature.nrpn,1,(this.temperature * 100) >> 7,(this.temperature * 100) & 0xFF)
    sendNRPN(midiOutputName,config.acid.split.nrpn,1,this.split,0)
    sendNRPN(midiOutputName,config.acid.deviate.nrpn,1,this.deviate,0)
    for (let l = 0; l < 3; l++) {
      ['device.A','device.B'].forEach( key => {
        sendNRPN(midiOutputName,_.get(config.acid.lfo[l + 1],`${key}.nrpn`),1,_.get(this.lfo[l],key),0)
      })
    }
  }

  sendMainValues() {
    debug('send main')

    this.sendTopValues()

    sendNRPN(midiOutputName,config.acid.transpose.nrpn,1,this.transpose + 12,0)
    sendNRPN(midiOutputName,config.acid.gate.nrpn,1,this.gate * 64,0)
    sendNRPN(midiOutputName,config.acid.octave.nrpn,1,((this.chance / 100) * 64) + 64,0)

    sendNRPN(midiOutputName,config.acid.density.nrpn,1,this.density,0)
    sendNRPN(midiOutputName,config.acid.killSteps.nrpn,1,this.killSteps,0)
    sendNRPN(midiOutputName,config.acid.killShift.nrpn,1,this.killShift + 15,0)

    sendNRPN(midiOutputName,config.acid.scales.nrpn,1,this.scales,0)
    sendNRPN(midiOutputName,config.acid.base.nrpn,1,this.base,0)
    sendNRPN(midiOutputName,config.acid.shift.nrpn,1,this.shift + 16,0)

  }

  sendLFOValues() {
    debug('send LFO');

    this.sendTopValues()

    for (let l = 0; l < 3; l++) {
      ['control','shape','rate','phase','amount','offset','density'].forEach( key => {
        sendNRPN(midiOutputName,_.get(config.acid.lfo[l + 1],`${key}.nrpn`),1,_.get(this.lfo[l],key),0)
      })
    }


  }

  sendProgramValues() {
    debug('send program');

    this.sendTopValues();

    ['A','B'].forEach( dev => {
      ['port','channel','bank','program'].forEach( key => {
        sendNRPN(midiOutputName,_.get(config.acid.device,`${dev}.${key}.nrpn`),1,_.get(this.device,`${dev}.${key}`),0)
      })
    })
  }

  sendProgramChange(dev) {
    if (_.get(this.device,`${dev}.portName`)) {
      const output = Midi.output(_.get(this.device,`${dev}.portName`),true)
      if (output) {
        debugMidiControlChange('%s %d CC %y = %y',this.device[dev].portName,_.get(this.device,`${dev}.channel`),0,_.get(this.device,`${dev}.bank`))
        output.send('cc',{channel:_.get(this.device,`${dev}.channel`) - 1,controller:0,value:_.get(this.device,`${dev}.bank`)})
        debugMidiProgramChange('%s %d %y',this.device[dev].portName,_.get(this.device,`${dev}.channel`),_.get(this.device,`${dev}.program`))
        output.send('program',{channel:_.get(this.device,`${dev}.channel`) - 1,number:_.get(this.device,`${dev}.program`)})
      }
    }
  }


  handleNamedSysEx(midiName) {
    if (!midiCache[midiName]) {
      midiCache[midiName] = {}
    }

    return (msg) => {
//        debug('SysEx: %d %y',msg.bytes.length,msg.bytes)
      if (msg && msg.bytes && msg.bytes.length >= 5 && msg.bytes[0] == 0xF0 && msg.bytes[1] == 0x7D && msg.bytes[4] == 0xF7) {
        const data1 = msg.bytes[2]
        const data2 = msg.bytes[3]

        if (data1 == 0) { // preset switch on BCR2000, data2 holds new page number
          this.page = data2
        }
      }
    }

  }

  handleNamedCC(midiName) {

    if (!midiCache[midiName]) {
      midiCache[midiName] = {}
    }

    return (msg) => {
      /*    debug('handle: %y',msg)*/
      _.set(midiCache[midiName],`channel_${_.padStart(msg.channel + 1,2,'0')}.controller_${_.padStart(msg.controller,3,'0')}`, msg.value)
      if ((msg.channel + 1) == config.acid.channel && ((msg.controller == 6) || (msg.controller == 38))) {
        const msb = _.get(midiCache,`${midiName}.channel_${_.padStart(config.acid.channel,2,'0')}.controller_099`)
        const lsb = _.get(midiCache,`${midiName}.channel_${_.padStart(config.acid.channel,2,'0')}.controller_098`)
        if (msb == config.acid.generate.nrpn && (lsb >= 1 && lsb <= 8)) {
          if (msg.controller == 6) { //MSB
            if (msg.value) {
              this.pattern = Acid.generate(state)
              this.lastBut = 0
              /*            debug('HI %y',msg.value)*/
            }
          }
          if (msg.controller == 38) { //LSB
            // not used as value is always < 128
          }
        }
        if (msb == config.acid.temperature.nrpn && (lsb >= 1 && lsb <= 8)) {
          const msb = _.get(midiCache,`${midiName}.channel_${_.padStart(config.acid.channel,2,'0')}.controller_006`)
          const lsb = _.get(midiCache,`${midiName}.channel_${_.padStart(config.acid.channel,2,'0')}.controller_038`)
          this.temperature = (((msb << 7) | lsb) / 100)
          debug('temperature %y',this.temperature)
        }
        if (msb == config.acid.transpose.nrpn && (lsb >= 1 && lsb <= 8)) {
          if (msg.controller == 6) { //MSB
            const msb = _.get(midiCache,`${midiName}.channel_${_.padStart(config.acid.channel,2,'0')}.controller_006`)
            this.transpose = (msb - 12)
            debug('transpose: %y',this.transpose)

/*
const txt=`$rev R1
[encoder group:1, encoder:7, type: nrpn, msb: ${config.acid.test.nrpn}, lsb:1, min:${config.acid.test.min}, max:${msb}, channel:${config.acid.channel}, leds:1dot, showvalue:on, resolution: ${config.acid.test.resolution}, default:${config.acid.test.default}]
`
            const txt2 = Bacara.prepare_BCR2000(txt,{midi:'BCR2000'})
            debug('bcr2000: %y',txt2)
            Bacara.instruct_BCR2000(txt2,{midi:'BCR2000'})
*/
          }
        }
        if (msb == config.acid.gate.nrpn && (lsb >= 1 && lsb <= 8)) {
          if (msg.controller == 6) { //MSB
            const msb = _.get(midiCache,`${midiName}.channel_${_.padStart(config.acid.channel,2,'0')}.controller_006`)
            this.gate = parseFloat((msb / 64 ).toFixed(2))
            if (this.gate > 1.92) {
              this.gate = 1.92
            }
            debug('gate: %y',this.gate)
          }
        }
        if (msb == config.acid.prev.nrpn && (lsb >= 1 && lsb <= 8)) {
          const msb = _.get(midiCache,`${midiName}.channel_${_.padStart(config.acid.channel,2,'0')}.controller_006`)
          if (msb && msg.controller == 6) {

            this.lastBut += 1

            this.pattern = Acid.last(state)
            debug('prev: %y', this.lastBut)
          }
        }
        if (msb == config.acid.next.nrpn && (lsb >= 1 && lsb <= 8)) {
          const msb = _.get(midiCache,`${midiName}.channel_${_.padStart(config.acid.channel,2,'0')}.controller_006`)
          if (msb && msg.controller == 6) {

            this.lastBut -= 1
            if (this.lastBut < 0) {
              this.lastBut = 0
            }

            this.pattern = Acid.last(state)
            debug('next: %y', this.lastBut)
          }
        }
        if (msb == config.acid.reset.nrpn && (lsb >= 1 && lsb <= 8)) {
          const msb = _.get(midiCache,`${midiName}.channel_${_.padStart(config.acid.channel,2,'0')}.controller_006`)
          if (msb && msg.controller == 6) {

            this.reset()
            this.sendValues()

            debug('reset')
          }
        }
        if (msb == config.acid.octave.nrpn && (lsb >= 1 && lsb <= 8)) {
          if (msg.controller == 6) { //MSB
            let tmp = _.get(midiCache,`${midiName}.channel_${_.padStart(config.acid.channel,2,'0')}.controller_006`) - 64
            if (tmp < 0) {
              tmp = Math.floor((tmp / 64) * 100)
            }
            if (tmp > 0) {
              tmp = Math.floor((tmp / 64) * 100)
            }
            if (tmp != this.chance) {
              this.chance = tmp
//              this.genOctaves(this.chance)
              debug('chance: %y', this.chance)
            }
          }
        }
        if (msb == config.acid.density.nrpn && (lsb >= 1 && lsb <= 8)) {
          if (msg.controller == 6) { //MSB
            let tmp = _.get(midiCache,`${midiName}.channel_${_.padStart(config.acid.channel,2,'0')}.controller_006`)
            if (tmp != this.density) {
              this.density = tmp
//              this.genSounding(this.density)
              debug('density: %y', this.density)
            }
          }
        }
        if (msb == config.acid.killSteps.nrpn && (lsb >= 1 && lsb <= 8)) {
          if (msg.controller == 6) { //MSB
            let tmp = _.get(midiCache,`${midiName}.channel_${_.padStart(config.acid.channel,2,'0')}.controller_006`)
            if (tmp != this.killSteps) {
              this.killSteps = tmp
              this.euclidian(this.killSteps,16,this.killShift)
              debug('killSteps: %y', this.killSteps)
            }
          }
        }
        if (msb == config.acid.killShift.nrpn && (lsb >= 1 && lsb <= 8)) {
          if (msg.controller == 6) { //MSB
            let tmp = _.get(midiCache,`${midiName}.channel_${_.padStart(config.acid.channel,2,'0')}.controller_006`) - 15
            if (tmp != this.killShift) {
              this.killShift = tmp
              this.euclidian(this.killSteps,16,this.killShift)
              debug('killShift: %y', this.killShift)
            }
          }
        }
        if (msb == config.acid.scales.nrpn && (lsb >= 1 && lsb <= 8)) {
          if (msg.controller == 6) { //MSB
            let tmp = _.get(midiCache,`${midiName}.channel_${_.padStart(config.acid.channel,2,'0')}.controller_006`)
            if (tmp != this.scales) {
              this.scales = tmp
              debug('scales: %y = %s', this.scales, scaleMappings.scales[this.scales].name )
            }
          }
        }
        if (msb == config.acid.base.nrpn && (lsb >= 1 && lsb <= 8)) {
          if (msg.controller == 6) { //MSB
            let tmp = _.get(midiCache,`${midiName}.channel_${_.padStart(config.acid.channel,2,'0')}.controller_006`)
            if (tmp != this.base) {
              this.base = tmp
              debug('base: %y', this.base)
            }
          }
        }
        if (msb == config.acid.shift.nrpn && (lsb >= 1 && lsb <= 8)) {
          if (msg.controller == 6) { //MSB
            let tmp = _.get(midiCache,`${midiName}.channel_${_.padStart(config.acid.channel,2,'0')}.controller_006`) - 16
            if (tmp != this.shift) {
              this.shift = tmp
              debug('shift: %y', this.shift)
            }
          }
        }
        if (msb == config.acid.split.nrpn && (lsb >= 1 && lsb <= 8)) {
          if (msg.controller == 6) { //MSB
            let tmp = _.get(midiCache,`${midiName}.channel_${_.padStart(config.acid.channel,2,'0')}.controller_006`)
            if (tmp != this.split) {
              this.split = tmp
              debug('split: %y', this.split)
            }
          }
        }
        if (msb == config.acid.deviate.nrpn && (lsb >= 1 && lsb <= 8)) {
          if (msg.controller == 6) { //MSB
            let tmp = _.get(midiCache,`${midiName}.channel_${_.padStart(config.acid.channel,2,'0')}.controller_006`)
            if (tmp != this.deviate) {
              this.deviate = tmp
              debug('deviate: %y', this.deviate)
            }
          }
        }

        for (let l = 0; l < 3; l++) {
          ['control','shape','rate','phase','amount','offset','density','device.A','device.B'].forEach( key => {
            if (msb == _.get(config.acid.lfo[l + 1],`${key}.nrpn`) && (lsb >= 1 && lsb <= 8)) {
              if (msg.controller == 6) { //MSB
                let tmp = _.get(midiCache,`${midiName}.channel_${_.padStart(config.acid.channel,2,'0')}.controller_006`)
                if (tmp != _.get(this.lfo[l],key)) {
                  _.set(this.lfo[l],key,tmp)
//                  const nameA = typhonCCs[this.lfo[l].control]
//                  const nameB = virusCCs[this.lfo[l].control]
                  let names = []

                  if (key=='shape') {
                    const idx = Math.floor((tmp/16) * shapes.length)
                    this.lfo[l].shapeName = shapes[idx]
                    names.push(this.lfo[l].shapeName)
                  }
                  if (key=='control' && typhonCCs[this.lfo[l].control]) names.push('typhon '+typhonCCs[this.lfo[l].control])
                  if (key=='control' && virusCCs[this.lfo[l].control]) names.push('virus '+virusCCs[this.lfo[l].control])

                  debug('lfo.%d.%s: %y%s', l + 1, key, _.get(this.lfo[l],key),names.length ? ` [ ${names.join(', ')} ]`: '')
//                  if (key=='shape') debug('shape %s',this.lfo[l].shapeName)
                  this.write(true) // write because lfo values are deep values
                }
              }
            }
          })
        }

        ['A','B'].forEach( dev => {
          ['port','channel','bank','program'].forEach( key => {
            if (msb == _.get(config.acid.device,`${dev}.${key}.nrpn`) && (lsb >= 1 && lsb <= 8)) {
              if (msg.controller == 6) { //MSB
                let tmp = _.get(midiCache,`${midiName}.channel_${_.padStart(config.acid.channel,2,'0')}.controller_006`)
                if (tmp != _.get(this.device,`${dev}.${key}`)) {
                  _.set(this.device,`${dev}.${key}`,tmp)
//                  const nameA = typhonCCs[this.lfo[l].control]
//                  const nameB = virusCCs[this.lfo[l].control]
                  let names = []
                  if (key == 'port') {
                    const midiNames = easymidi.getInputs()
                    if (midiNames /*&& _.get(this.device,`${dev}.${key}`) < midiNames.length*/) {
                      const idx = Math.floor((tmp/64) * midiNames.length)
                      names.push(midiNames[idx])
                      _.set(this.device,`${dev}.${key}Name`,midiNames[idx])
                    } else {
                      _.set(this.device,`${dev}.${key}Name`,null)
                    }
                  }
                  debug('device.%s.%s: %y %s', dev, key, _.get(this.device,`${dev}.${key}`),names.length ? ` [ ${names.join(', ')} ]` : '')

                  this.sendProgramChange(dev)
                  this.write(true) // write because device values are deep values
                }
              }
            }
          })
        })
      }
    }
  }
}

let state // = new State()


function sendNRPN(midiName,msb,lsb,valueMsb,valueLsb) {
  if (midiName) {
    const midiOutput = Midi.output(midiName,true)
    if (midiOutput) {
      midiOutput.send('cc',{channel:config.acid.channel - 1,controller:99,value:msb})
      midiOutput.send('cc',{channel:config.acid.channel - 1,controller:98,value:lsb})
      midiOutput.send('cc',{channel:config.acid.channel - 1,controller:6,value: valueMsb})
      midiOutput.send('cc',{channel:config.acid.channel - 1,controller:38,value: valueLsb})
    }
  }
}

/*const delta = process.hrtime(time)
debug('delta %y',delta)

const deltaDuration = (delta[0] * 1000) + (delta[1] / 1000000)
pulses = Math.ceil(deltaDuration / pulseDuration)
if (pulses == Infinity) pulses=0

debug('pulses %y',pulses)
*/

const midiCache = {}


function acidSequencer(name, sub, options) {

/*  debug('args: %y',options)*/
  /*  if (!state.pattern) {
   state.pattern = Acid.generate(state)
  }

*/  /*  debug('playing: %y\ntemperature: %y\ntranspose: %y\npattern: %y',playing,temperature,transpose,pattern)*/

  state = new State()

  const input = Midi.input(options.input, true)
  const output = Midi.output(options.output, true)
  const transpose = (options.transposePort ? Midi.input(options.transposePort, true) : null)


  if (!midiCache[options.output]) {
    midiCache[options.output] = {}
  }

  ['A', 'B'].forEach( dev => {
    if (state.device[dev].portName) {
      const output = Midi.output(state.device[dev].portName,true)
      if (output) {
        const channel = state.device[dev].channel - 1

        for (let midiNote = 0; midiNote < 128; midiNote++) {
          debugMidiNoteOff('%s %d %y',state.device[dev].portName,channel+1,midiNote)
          output.send('noteoff', {
            note: midiNote,
            velocity: 127 ,
            channel: channel,
          })
        }
      }
    }
  })

/*
  shutdownHook.add(_ => {
    debug('shutdown NotesSend %y',notesSend)

    for (let midiNote = 0; midiNote < 128; midiNote++) {
      debugMidiNoteOff('%s %d %y',state.device[dev].portName,deviceChannels.A,midiNote)
      output.send('noteoff', {
        note: midiNote,
        velocity: 127 ,
        channel: deviceChannels.A - 1,
      })
      debugMidiNoteOff('%s %d %y',state.device[dev].portName,deviceChannels.B,midiNote)
      output.send('noteoff', {
        note: midiNote,
        velocity: 127 ,
        channel: deviceChannels.B - 1,
      })
    }


    return new Promise((resolve,reject) => {
      setTimeout(() => {
        resolve(0)
        debug('bye')
      },500)
    })
  })
*/

  /*  debug('options: %y',options)*/

  if (options.midi) {
    midiInputName = options.midi
    midiOutputName = options.midi
  }

  function radians(degrees) {
    return (degrees % 360) * (Math.PI / 180)
  }


  function lfo(step, stepsPerCycle, shape, phase) {
    let cycleStep = ((step + 0) + (((phase + 0.0) % 1.0) * stepsPerCycle)) % stepsPerCycle
//    debug('JJR lfo: step: %y  stepsPerCycle: %y  shape: %y  phase: %y  cycleStep: %y',step, stepsPerCycle, shape, phase, cycleStep)
    switch (shape) {
      case 'sine':
        cycleStep = ((step + 0) + (((phase + 0.75) % 1.0) * stepsPerCycle)) % stepsPerCycle
        return (Math.sin(radians(((cycleStep / stepsPerCycle) * 360 ))) + 1.0) * 64
      case 'triangle':
        cycleStep = cycleStep / 2
        if (cycleStep < (stepsPerCycle * 0.25)) {
          return ( 0.0 + ((cycleStep/(stepsPerCycle/4)))) * 128
        } else {
          return ( 1.0 - ((cycleStep - (stepsPerCycle/4) )/(stepsPerCycle/4))) * 128
        }
      case 'saw-up':
        return (((cycleStep * 2) / stepsPerCycle) * 128) % 128
      case 'saw-down':
        return (( 2.0 - ( (cycleStep * 2) / stepsPerCycle)) * 128) % 128
      case 'square':
        return (cycleStep < (stepsPerCycle / 4)) || ((cycleStep >= (stepsPerCycle / 2)) && (cycleStep < (stepsPerCycle * 0.75))) ? 128 : 0
      case 'random':
        return getRandomInt(127)
    }
    return -1
  }

  if (transpose) {
    transpose.on('message', (msg) => {
      //debug('transpose: %y',msg)
      if ((!options.transposeChannel || msg.channel == (options.transposeChannel-1)) && msg._type == 'noteon') {
        state.transpose = msg.note - 48
        debug('transpose: %y',state.transpose)
        sendNRPN(midiOutputName,config.acid.transpose.nrpn,1,state.transpose + 12,0)
      }
    })
  }


  let lastTime = 0
  let pulseTime = [0, 0]
  input.on('clock', () => {
    //    pulses++
    //    debug('playing: %y %y',state.playing,pulses)
    const deltaTime = process.hrtime(pulseTime)
    pulseTime = process.hrtime()

    const ticks = (pulses % (24 * 4)) * 20
    pulseDuration = (deltaTime[0] * 1000) + (deltaTime[1] / 1000000)

    const ticksPerStep = 120
    const stepIdx = ticks / ticksPerStep
    if (state.playing) {
      const tickDuration = pulseDuration / 20
      const shiftedTicks = (ticks + (ticksPerStep * state.shift)) % (ticksPerStep * 16)

      // if (! (stepIdx % 1) ) {
      for (let l = 0; l < 3; l++) {
        if (state.lfo[l].control && state.lfo[l].amount && (state.lfo[l].device.A || state.lfo[l].device.B)) {
          if (!(steps % ((128-state.lfo[l].density)*2))) {
//            debug('JJR: l:%d steps:%y stepIdx:%y ticks:%y',l,steps,stepIdx,ticks)
            const factor = (state.lfo[l].amount / 100)
            const base = Math.floor((((100 - state.lfo[l].amount) / 100) * 128) / 2)
            const offset = Math.floor(base * (((state.lfo[l].offset - 50) ) / 50) )
            const mod = lfo( steps, (128 - state.lfo[l].rate) * 4, state.lfo[l].shapeName, state.lfo[l].phase / 100)
            if (mod>=0) {
              const value = Math.min(127,Math.max(0,Math.floor(( mod * factor) + base + offset )))
//             debug('JJR base: %y  factor: %y  offset: %y  amount: %y  rate: %y  phase: %y  mod: %y   value: %y  ',base,factor,offset,state.lfo[l].amount,state.lfo[l].rate,state.lfo[l].phase,mod,value)

              const devs = []

              if (state.lfo[l].device.A) devs.push('A')
              if (state.lfo[l].device.B) devs.push('B')

              devs.forEach( dev => {
                if (state.device[dev].portName) {
                  const channel = state.device[dev].channel - 1
                  const pth = `port_${state.device[dev].portName}.channel_${_.padStart(channel + 1,2,'0')}.controller_${_.padStart(state.lfo[l].control,3,'0')}`
                  const midiValue = Math.min(127,value)

                  if (_.get(midiCache[options.output],pth) != midiValue) {
                    // debug('offset: %y, value %y base %y  mod %y',offset,midiValue,base,mod)
                    // debug('LFO%d step [%d] channel %d  control %d  amount %d  rate %d value %f',l+1,stepIdx,channel+1,state.lfo[l].control,state.lfo[l].amount,state.lfo[l].rate,value)

                    const output = Midi.output(state.device[dev].portName,true)
                    if (output) {
                      debugMidiControlChange('%s %d CC %y = %y',state.device[dev].portName,channel+1,state.lfo[l].control,midiValue)
                      output.send('cc',{channel,controller:state.lfo[l].control,value:midiValue})
                      _.set(midiCache[options.output],pth, midiValue)
                      sendNRPN(midiOutputName,config.acid.lfo[l+1].show.nrpn,1,midiValue,0)
                    }
                  }
                }
              })
            }
          }
        }
      }
      // }
      if (state.pattern) {
        state.pattern.tracks[0].notes.forEach( (note/*,idx*/) => {
          if (note.ticks == shiftedTicks) {
          /*                    debug('* %y %y',stepIdx,sounding[stepIdx])*/
            if (stepIdx < state.sounding.length && state.sounding[stepIdx]) {
              let midiNote = note.midi + state.transpose + ((stepIdx < state.octaves.length && state.octaves[stepIdx]) ? (state.octaves[stepIdx] * 12) : 0)

              /*            debug('midiNote %y',midiNote)*/
              const scaleMapping = scaleMappings.scales[state.scales]
              const midiNoteFromBase = (midiNote + state.base) % 12
              const midiNoteBase =  midiNote - midiNoteFromBase
              if (scaleMapping.mapping[midiNoteFromBase] != midiNoteFromBase) {
                debug('scale: %s %y => %y',scaleMapping.name, midiNoteFromBase, scaleMapping.mapping[midiNoteFromBase])
                midiNote = (midiNoteBase + scaleMapping.mapping[midiNoteFromBase]) - state.base
              }
              const rnd = getRandomInt(100)

              const switchChannel = (state.deviate && state.deviate >= rnd)
              const channel = (midiNote <= state.split) ? (switchChannel ? 1 : 0) : (switchChannel ? 0 : 1)

              const dev =  (midiNote <= state.split) ? (switchChannel ? 'B' : 'A') : (switchChannel ? 'A' : 'B')

              if (state.device[dev].portName) {
                const output = Midi.output(state.device[dev].portName,true)
                if (output) {
                  const channel = state.device[dev].channel - 1
                  debugMidiNoteOn('%s %d %y',state.device[dev].portName,channel+1,midiNote)
                  output.send('noteon', {
                    note: midiNote,
                    velocity: 127 * note.velocity,
                    channel: channel,
                  })

                  notesSend.push(midiNote)

                  const b = Math.floor(note.durationTicks / ticksPerStep) * ticksPerStep
                  const r = (note.durationTicks % ticksPerStep) * state.gate
                  setTimeout((midiNote) => {
                    debugMidiNoteOff('%s %d %y',state.device[dev].portName,channel+1,midiNote)
                    output.send('noteoff', {
                      note: midiNote,
                      velocity: 127 ,
                      channel: channel,
                    })
                    const pos = notesSend.indexOf(midiNote)
                    if (pos >= 0) {
                      notesSend.splice(pos,1)
                    }
                  }, b + r /*(note.durationTicks * tickDuration) * gate*/, midiNote)
                }
              }
            }
          }
        })
      }
      if (! (ticks % 1) ) {
        steps++
      }
    }
    pulses++
  })

  input.on('start', () => {
    state.playing = true
    pulses = 0
    steps = 0
    pulseTime = process.hrtime()
    debug('start')
  })

  input.on('stop', () => {
    state.playing = false
    debug('stop')
  })

  input.on('continue', () => {
    state.playing = true
    pulseTime = process.hrtime()
    debug('continue')
  })

  if (midiInputName) {
    const midiInput = Midi.input(midiInputName, true)
    midiInput.on('cc', state.handleNamedCC(midiInputName) )
    midiInput.on('sysex', state.handleNamedSysEx(midiInputName) )
  }


  const midiOutput = Midi.output(midiOutputName,true)
  if (midiOutput) {
    debug('PC : %y',state.page)
    midiOutput.send('program',{channel:config.acid.channel - 1,number:state.page})
  }

  state.sendValues()
/*
  const txt = `
$rev R1
[encoder group:1, encoder:7, type: nrpn, msb: ${config.acid.test.nrpn}, lsb:1, min:${config.acid.test.min}, max:${config.acid.test.max}, channel:${config.acid.channel}, leds:1dot, showvalue:on, resolution: ${config.acid.test.resolution}, default:${config.acid.test.default}]
`
  Bacara.instruct_BCR2000(Bacara.prepare_BCR2000(txt,options),options)
*/
  Acid.table(state)
}

module.exports = {
  name: 'acid',
  description: 'Acid Sequencer',
  handler: acidSequencer,
}



