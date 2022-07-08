const debug = require('yves').debugger(require('../package.json').name + ':lib:midi:' + (require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':'))

const patternTraining = require('../training/pattern.js')

const fs = require('fs-extra')
const path = require('path')
const glob = require('glob')
const toneJSmidi = require('@tonejs/midi')

const Table = require('cli-table3')
const chalk = require('chalk')
const { Midi } = require('@tonaljs/tonal')

const untildify = require('untildify')
const jsonfile = require('jsonfile')
const _ = require('lodash')

const scaleMappings = require('../extra/scales/scales.json')

let temperature = 1.0
let velocity = 100
let patternLength = 16
let currentSteps = []

const ticksPerStep = 120
const Random = require('./random')

function generateLetter(patternTraining, history, order, temperature) {
  let h = history.slice(-order)
  let dist = {}
  let l = patternTraining[h]
  for (let key in l) {
    if ({}.hasOwnProperty.call(l, key)) {
      let v = l[key]
      dist[key] = (v / temperature) + 1.0 - (1.0 / temperature)
    }
  }
  let x = Random.getRandomFloat(true)
  for (let k in dist) {
    if ({}.hasOwnProperty.call(dist, k)) {
      let p = dist[k]
      x = x - p
      if (x <= 0.0) {
        return k
      }
    }
  }
}

function generateText(patternTraining, order, nletters, temperature) {
  let starts = Object.keys(patternTraining).filter(function(k) {
    return k.slice(-2) === '~\n'
  })
  let history = starts[Math.floor(Random.getRandomFloat(true) * Math.floor(starts.length))]
  let s = ''
  for (let i = 0; i < nletters; i++) {
    let c = generateLetter(patternTraining, history, order, temperature)
    history = history.slice(1) + c
    s += c
  }
  return s
}

function generatePattern(patternTraining, order, patternLength, temperature) {
  let stepLength = 9
  let text = generateText(patternTraining, order, (stepLength + 2) * patternLength, temperature)
  let lines = text.split('\n')
  let re = /^(.)!([01])\$([01])#([01])=$/
  let s = 0
  let steps = []
  let c1 = 36


  for (let l = 0; l < lines.length; l++) {
    let line = lines[l]
    if (line === '~') {
      continue
    }
    let m = line.match(re)
    if (m === null) {
      continue
    }

    let step = {
      note: m[1].charCodeAt(0) - 82 + c1,
      accent: m[2] === '1',
      slide: m[3] === '1' ? 1 : 0,
      gate: m[4] === '1' ? 1 : 0
    }

    steps.push(step)

    s = s + 1
    if (s === patternLength) {
      break
    }
  }

  return steps
}

class Pattern {

  static bankName(state) {
    return `bank-${('00' + ((state && state.bank) ? state.bank : 0)).slice(-3)}`
  }

  static generate(state, aPatternLength) {
    Random.reset()

    const size = aPatternLength ? aPatternLength : patternLength
    const steps = generatePattern(patternTraining, 18, size, (state && state.temperature) ? state.temperature : temperature)
    //    debug('generated: %y',steps)

    function Note(pitch, start, duration, velocity) {
      this.midi = pitch
      this.time = start / 2
      this.duration = duration / 2
      if ((this.time + this.duration) > 2.0) {
        /*        this.duration = 2.0 - this.time*/
      }
      this.velocity = (velocity + 1) / 128
    }

    let fixGate = false

    let notes = []
    let lastStep = null
    let previousNote = null
    steps.forEach((step, index) => {
      if (!(!fixGate && step.gate === 0)) {
        if (lastStep && lastStep.note === step.note && lastStep.slide && (fixGate || lastStep.gate)) {
          // slide and same pitch as previous step -> extend duration of previous note
          if (step.slide && previousNote) {
            previousNote.duration += 0.125 //0.25;
          }
        } else {
          const note = new Note(step.note, index / 4.0, step.slide ? 0.375 : (0.250 - 0.005)/*0.125*/, step.accent ? 127 : velocity)
          notes.push(note)
          previousNote = note
        }
        lastStep = step
      }
    })

    const name = `Bacara - ${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')}`

    const midiFile = new toneJSmidi.Midi()
    midiFile.name = name

    const track = midiFile.addTrack()

    //    debug('notes %y = %y ',notes.length,notes)
    //    notes.forEach( (note,index) => debug('Note %y %y',index,note) )

    track.name = name
    notes.forEach( (note, index) => {
      track.addNote(note)
      //      debug('Note %y %y',index,note)
    })

    //    debug('midiFile %y',midiFile)

    const filepath = path.resolve((process.env.NODE_ENV == 'production') ? untildify(`~/.electra-one/state/bacara/${Pattern.bankName(state)}/patterns/${name.replace(/:/g, '.')}.mid`) : `${__dirname}/../state/bacara/${Pattern.bankName(state)}/patterns/${name.replace(/:/g, '.')}.mid`)
    fs.ensureDirSync(path.dirname(filepath))
    fs.writeFileSync(filepath, new Buffer.from(midiFile.toArray()))

    const midiData = fs.readFileSync(filepath)
    const midiJson = new toneJSmidi.Midi(midiData)
    midiJson.tracks[0].instrument.number = 38

    let maxTicks = 0
    _.get(midiJson, 'tracks.0.notes', []).forEach( note => {
      if (maxTicks < note.ticks) {
        maxTicks = note.ticks
      }
    })
    const ticksPerStep = 120
    let patternSteps = 1
    while (Math.floor(maxTicks / ticksPerStep) > patternSteps) {
      patternSteps *= 2
    }
    _.set(state, 'patternSteps', patternSteps)

    //    state.size = size
    return midiJson
  }

  static patternFiles(state, count = false) {
    const files = glob.sync(path.resolve(
      ( (process.env.NODE_ENV == 'production') ? path.join(untildify('~/.electra-one'), 'state', 'bacara', Pattern.bankName(state), 'patterns') : path.join(__dirname, '..', 'state', 'bacara', Pattern.bankName(state), 'patterns') ) + '/*.mid'), {})
    return count ? (Array.isArray(files) ? files.length : 0) : files
  }

  static load_pattern(state, patternIdx) {
    const patternFiles = Pattern.patternFiles(state)
    if (patternIdx >= 0 && patternIdx < patternFiles.length &&  patternFiles[patternIdx]) {
      const midiData = fs.readFileSync(patternFiles[patternIdx])
      const midiJson = new toneJSmidi.Midi(midiData)

      let maxTicks = 0
      _.get(midiJson, 'tracks.0.notes', []).forEach( note => {
        if (maxTicks < note.ticks) {
          maxTicks = note.ticks
        }
      })
      const ticksPerStep = 120
      let patternSteps = 1
      while (Math.floor(maxTicks / ticksPerStep) > patternSteps) {
        patternSteps *= 2
      }
      _.set(state, 'patternSteps', patternSteps)

      return midiJson
    }
  }

  static presetFiles(state, count = false) {
    const files = glob.sync(path.resolve(
      ( (process.env.NODE_ENV == 'production') ? path.join(untildify('~/.electra-one'), 'state', 'bacara', Pattern.bankName(state), 'presets') : path.join(__dirname, '..', 'state', 'bacara', Pattern.bankName(state), 'presets') ) + '/*.json'), {})
    return count ? (Array.isArray(files) ? files.length : 0) : files
  }

  static load_preset(state) {

    const presetFiles = Pattern.presetFiles(state)

    let but = (state && state.last_preset_but ? state.last_preset_but : 0)
    if (!but) {
      but = 0
    }
    if (but < 0) {
      but = 0
    }
    if (but > (presetFiles.length - 1)) {
      but = presetFiles.length - 1
    }
    if (state) {
      state.last_preset_but = but
    }

    const filename = presetFiles[(presetFiles.length - 1) - but]
    if (filename) {
      const values = jsonfile.readFileSync(filename)
      if (values) {
        const bank = state.bank ? state.bank : 0
        const playing = state.playing
        const last_preset_but = state.last_preset_but
        state.values = values
        state.bank = bank
        state.program = ((presetFiles.length - 1) - but) >= 0 ? ((presetFiles.length - 1) - but) : 0
        state.last_preset_but = last_preset_but
        state.playing = playing
      }
      return filename
    }
  }

  static save_preset(state) {
    const name = `Bacara - ${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')}`
    const filePath = path.resolve((process.env.NODE_ENV == 'production') ? untildify(`~/.electra-one/state/bacara/${Pattern.bankName(state)}/presets/${name.replace(/:/g, '.')}.json`) : `${__dirname}/../state/bacara/${Pattern.bankName(state)}/presets/${name.replace(/:/g, '.')}.json`)
    fs.ensureDirSync(path.dirname(filePath))
    jsonfile.writeFileSync(filePath, state.values, { flag: 'w', spaces: 2 })
    state.last_preset_but = 0
    state.program = Pattern.presetFiles(state, true) - 1
    return filePath
  }

  static table(state) {
    if (!state || !state.pattern) {
      return
    }
    const accentedColor = chalk.bgHex('#FF8800')
    const normalColor = chalk.bgHex('#00BB00')
    const disabledColor = chalk.bgHex('#666666')

    const deviceAColor = chalk.hex('#FF0000')
    const deviceBColor = chalk.hex('#0000FF')
    //    const deviceAColor = chalk.hex('#F45C51')
    //    const deviceBColor = chalk.hex('#529DEC')

    let table = new Table(
      {
        head: [
          'Device',
          'Notes',
          {colSpan:state.size, content:state.pattern.header.name + `              normal ${normalColor('  ')}   accented ${accentedColor('  ')}   disabled ${disabledColor('  ')}`}
        ]
        /*,style:{head:[],border:[]}*/
      }
    )

    const notes = []
    state.pattern.tracks[0].notes.forEach( note => {
      if (notes.indexOf(note.midi) < 0) {
        notes.push(note.midi)
      }
    })
    notes.sort()
    notes.reverse()

    notes.forEach( noteMidi => {
      let midiNote = noteMidi
      const scaleMapping = scaleMappings.scales[state.scales]
      const midiNoteFromBase = (midiNote + state.base) % 12
      const midiNoteBase =  midiNote - midiNoteFromBase
      if (scaleMapping && scaleMapping.mapping[midiNoteFromBase] != midiNoteFromBase) {
        //                debug('scale: %s %y => %y',scaleMapping.name, midiNoteFromBase, scaleMapping.mapping[midiNoteFromBase])
        midiNote = (midiNoteBase + scaleMapping.mapping[midiNoteFromBase]) - state.base
      }

      const noteMidiTransposed = midiNote + state.transpose

      const arr = [
        {hAlign:'center', content:(state && state.split && noteMidiTransposed <= state.split) ? ((state.deviate >= 50) ? deviceBColor('B') : deviceAColor('A')) : ((state.deviate >= 50) ? deviceAColor('A') : deviceBColor('B')) },
        {hAlign:'center', content:Midi.midiToNoteName(noteMidiTransposed - 12, { sharps: true })/*+` ${noteMidi}`*/}
      ]
      for (let ticks = 0; ticks < (state.size * ticksPerStep); ticks += ticksPerStep) {
        let chNote = '  '
        state.pattern.tracks[0].notes.forEach( note => {
          if (note.midi  == noteMidi && note.ticks == ticks) {
            const count = Math.ceil(note.durationTicks / ticksPerStep)
            const color = state.sounding[ticks / ticksPerStep] ? (note.velocity == 1 ? accentedColor : normalColor) : disabledColor
            const rep = count * 2 + ((count - 1) * 3)
            chNote = {colSpan:count, content:color(' '.repeat(rep >= 0 ? rep : 0))}
            ticks += (count - 1) * ticksPerStep
          }
        })
        if (chNote) {
          arr.push(chNote)
        }
      }
      table.push(arr)
    })

    //        console.log(table.toString())
    //    debug(table.toString())
  }
}

//const state = {}
//state.pattern = Pattern.generate(state,32)
//debug('state %y',state)
//process.exit()
module.exports = Pattern

