const debug = require('debug')(require('../package.json').name + ':lib:' + require('path').basename(__filename, '.js'))

const acidTraining = require('../training/acid.js')

const fs = require('fs-extra')
const path = require('path')
const glob = require('glob')
const toneJSmidi = require('@tonejs/midi')

const Table = require('cli-table3')
const chalk = require('chalk')
const { Midi } = require('@tonaljs/tonal')

const untildify = require('untildify')
const jsonfile = require('jsonfile')

const scaleMappings = require('../extra/scales/scales.json')

let temperature = 1.0
let velocity = 100
let patternLength = 16
let currentSteps = []

const ticksPerStep = 120

function generateLetter(acidTraining, history, order, temperature) {
  let h = history.slice(-order)
  let dist = {}
  let l = acidTraining[h]
  for (let key in l) {
    if ({}.hasOwnProperty.call(l, key)) {
      let v = l[key]
      dist[key] = (v / temperature) + 1.0 - (1.0 / temperature)
    }
  }
  let x = Math.random()
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

function generateText(acidTraining, order, nletters, temperature) {
  let starts = Object.keys(acidTraining).filter(function(k) {
    return k.slice(-2) === '~\n'
  })
  let history = starts[Math.floor(Math.random() * Math.floor(starts.length))]
  let s = ''
  for (let i = 0; i < nletters; i++) {
    let c = generateLetter(acidTraining, history, order, temperature)
    history = history.slice(1) + c
    s += c
  }
  return s
}

function generatePattern(acidTraining, order, patternLength, temperature) {
  let stepLength = 9
  let text = generateText(acidTraining, order, (stepLength + 2) * patternLength, temperature)
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

const Acid = {

  bankName(state) {
    return `bank-${('00' + (state.bank ? state.bank : 0)).slice(-3)}`
  },

  generate(state) {
    const size = patternLength
    const steps = generatePattern(acidTraining, 18, size, (state && state.temperature) ? state.temperature : temperature)
    //    debug('generated: %y',steps)

    function Note(pitch, start, duration, velocity) {
      this.midi = pitch
      this.time = start / 2
      this.duration = duration / 2
      if ((this.time + this.duration) > 2.0) {
        this.duration = 2.0 - this.time
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
            previousNote.Duration += 0.125 //0.25;
          }
        } else {
          const note = new Note(step.note, index / 4.0, step.slide ? 0.375 : 0.125, step.accent ? 127 : velocity)
          notes.push(note)
          previousNote = note
        }
        lastStep = step
      }
    })

    const name = `Acid - ${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')}`

    const midiFile = new toneJSmidi.Midi()
    midiFile.name = name

    const track = midiFile.addTrack()

    track.name = name
    notes.forEach( note => track.addNote(note) )

    const filepath = path.resolve((process.env.NODE_ENV == 'production') ? untildify(`~/.electra-one/state/acid/${Acid.bankName(state)}/patterns/${name.replace(/:/g, '.')}.mid`) : `${__dirname}/../state/acid/${Acid.bankName(state)}/patterns/${name.replace(/:/g, '.')}.mid`)
    fs.ensureDirSync(path.dirname(filepath))
    fs.writeFileSync(filepath, new Buffer.from(midiFile.toArray()))

    const midiData = fs.readFileSync(filepath)
    const midiJson = new toneJSmidi.Midi(midiData)
    midiJson.tracks[0].instrument.number = 38

    state.size = size
    return midiJson
  },

  load_pattern(state) {

    const patternFiles = glob.sync(path.resolve(
      ( (process.env.NODE_ENV == 'production') ? path.join(untildify('~/.electra-one'), 'state', 'acid', Acid.bankName(state), 'patterns') : path.join(__dirname, '..', 'state', 'acid', Acid.bankName(state), 'patterns') ) + '/*.mid'), {})

    let but = (state ? state.last_pattern_but : 0)
    if (!but) {
      but = 0
    }
    if (but < 0) {
      but = 0
    }
    if (but > (patternFiles.length - 1)) {
      but = patternFiles.length - 1
    }
    if (state) {
      state.last_pattern_but = but
    }

    if (patternFiles[(patternFiles.length - 1) - but]) {
      const midiData = fs.readFileSync(patternFiles[(patternFiles.length - 1) - but])
      const midiJson = new toneJSmidi.Midi(midiData)

      return midiJson
    }
  },

  presetFiles(state, count = false) {
    const files = glob.sync(path.resolve(
      ( (process.env.NODE_ENV == 'production') ? path.join(untildify('~/.electra-one'), 'state', 'acid', Acid.bankName(state), 'presets') : path.join(__dirname, '..', 'state', 'acid', Acid.bankName(state), 'presets') ) + '/*.json'), {})
    return count ? (Array.isArray(files) ? files.length : 0) : files
  },

  load_preset(state) {

    const presetFiles = Acid.presetFiles(state)

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
  },

  save_preset(state) {
    const name = `Acid - ${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')}`
    const filePath = path.resolve((process.env.NODE_ENV == 'production') ? untildify(`~/.electra-one/state/acid/${Acid.bankName(state)}/presets/${name.replace(/:/g, '.')}.json`) : `${__dirname}/../state/acid/${Acid.bankName(state)}/presets/${name.replace(/:/g, '.')}.json`)
    fs.ensureDirSync(path.dirname(filePath))
    jsonfile.writeFileSync(filePath, state.values, { flag: 'w', spaces: 2 })
    state.last_preset_but = 0
    state.program = Acid.presetFiles(state, true) - 1
    return filePath
  },

  table(state) {
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


      /*      debug('JJR: %y %y %y',(state && state.split && noteMidiTransposed <= state.split),state.split,noteMidiTransposed)*/
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

    console.log(table.toString())
  },
}

module.exports = Acid

