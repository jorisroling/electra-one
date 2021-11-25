const debug = require('yves').debugger(require('../package.json').name + ':' + (require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':'))

const model = require('../training/drum.js')
const maxContext = 32
const numInstruments = 12
const styles = ['all', 'house', 'breaks'] // all, house, breaks
const untildify = require('untildify')

const instruments = ['bd', 'sd', 'lt', 'mt', 'ht', 'rs', 'hc', 'cb', 'cy', 'oh', 'ch']
const instr_notes = [ 36,   38,   43,   47,   50,   37,   39,   49,   51,   46,   42]

const fs = require('fs-extra')
const path = require('path')
const toneJSmidi = require('@tonejs/midi')

//const { Midi } = require('@tonaljs/tonal')
let globalPrevious

const writeMidiFiles = true

const VELOCITY_LO = 80
const VELOCITY_HI = 112
const BASE_NOTE = 36

/*  Bitwig
bd 36
sd 37
lt 53
mt 54
ht 55
rs 52
hc 45
cb 46
cy 47
ch 38
oh 39
*/

class Note {
  constructor(pitch, start, duration, velocity, muted) {
    this.Pitch = pitch
    this.Start = start
    this.Duration = duration
    this.Velocity = velocity
    this.Muted = muted
  }

  toTonalJsMidi() {
    return {
      midi: this.Pitch + BASE_NOTE,               // midi number, e.g. 60
      time: this.Start / 2,               // time in seconds
      velocity: (this.Velocity + 1) / 128,           // normalized 0-1 velocity
      duration: this.Duration / 2,           // duration in seconds between noteOn and noteOff
    }
  }
}

/*{
  midi: Number,               // midi number, e.g. 60
  time: Number,               // time in seconds
  ticks: Number,              // time in ticks
  name: String,               // note name, e.g. "C4",
  pitch: String,              // the pitch class, e.g. "C",
  octave : Number,            // the octave, e.g. 4
  velocity: Number,           // normalized 0-1 velocity
  duration: Number,           // duration in seconds between noteOn and noteOff
}
*/

function generate(instrument, steps, style, previous) {
  const dict = model[style][instrument]
  let text = getTextToContinue(instrument, previous)
  const pattern = []

  while (pattern.length < steps) {
    if (((text.length - 1) % 5) === 4) {
      text = text + '-'
      continue
    }

    let context = text.slice(-maxContext)

    while (!{}.hasOwnProperty.call(dict, context)) {
      context = context.slice(1)
    }

    const dist = dict[context]
    let x = Math.random()

    for (let k in dist) {
      if ({}.hasOwnProperty.call(dist, k)) {
        const p = dist[k]
        x = x - p
        if (x <= 0.0) {
          text = text + k
          pattern.push(parseInt(k))
          break
        }
      }
    }
  }

  return pattern
}

function getTextToContinue(instrument, previous) {
  if (instrument > 0 && previous) {
    const texts = getTextFromPrevious(previous)
    return texts[instrument - 1]
  }

  return '^'
}

function getTextFromPrevious(previous) {

  const {notes, length} = previous

  const instrumentValues = []
  const steps = []

  for (let i = 0; i < instruments.length; i++) {
    //    const instrument = instruments[i]
    const pitch = i
    const velLow = VELOCITY_LO
    const velHigh = VELOCITY_HI
    instrumentValues[pitch] = [i, velLow, velHigh]
    steps[i] = []
  }

  for (let i = 0; i < notes.length; i++) {
    const note = notes[i]
    if (note.Muted === 1) {
      continue
    }
    const vals = instrumentValues[note.Pitch]

    if (vals) {
      const step = Math.floor(note.Start * 4.0)
      const idx = vals[0]
      const hi = vals[2]
      const val = note.Velocity >= hi ? '2' : '1'

      steps[idx][step] = steps[idx][step] ? '5' : val
    }
  }

  const texts = []

  for (let i = 0; i < instruments.length; i++) {
    let text = '^'
    for (let s = 0; s < (length * 4); s++) {
      if (s > 0 && (s % 4) === 0) {
        text += '-'
      }
      text += steps[i][s] || '0'
    }
    texts[i] = text
  }
  debug('texts %y', texts)
  return texts
}


function generateMidi(pattern, steps) {
  const swing = 50
  const flam = false
  const flamAmount = 10
  const accent = true
  const accentVel = 40
  const tempo = 120.0
  const beatsPerMs = tempo / (60.0 * 1000.0)
  const notes = []


  for (let i = 0; i < instruments.length; i++) {
    const instrument = instruments[i]
    const pitch = i
    const velLow = VELOCITY_LO
    const velHigh = VELOCITY_HI
    for (let s = 0; s < steps; s++) {
      const idx = 11 + s * 5
      const step = pattern[i][s]
      if (step === 0) {
        continue
      }
      const accentStep = pattern[11][s]
      const delay = (s % 2) * (1.0 / 8.0) * (swing - 50.0) / 25.0
      const start = (s / 4.0) + delay
      const acVel = accent && accentStep > 0 ? accentVel : 0
      const velLo = Math.min(127, velLow + acVel)
      const velHi = Math.min(127, velHigh + acVel)
      if (flam && step === 5) {
        const note1 = new Note(pitch, start, 10.0 * beatsPerMs, velLo, 0)
        const note2 = new Note(pitch, start + flamAmount * beatsPerMs, 10.0 * beatsPerMs, velHi, 0)
        notes.push(note1, note2)
      } else {
        const note = new Note(pitch, start, 1.0 / 8.0, step > 1 ? velHi : velLo, 0)
        notes.push(note)
      }
    }
  }

  return notes
}

class Drums {
  static baseNote() {
    return BASE_NOTE
  }

  static bankName(state) {
    return `bank-${('00' + ((state && state.bank) ? state.bank : 0)).slice(-3)}`
  }

  static generate(steps, style, instrument = -1, patterns = [], previous = null) {
    debug('generate(%y,%y,%y)', steps, style, instrument)
    if (Number.isInteger(style) && style >= 0 && style < styles.length) {
      style = styles[style]
    }
    if (instrument >= 0 && instrument < numInstruments && Array.isArray(patterns)) {
      patterns[instrument] = generate(instrument, steps, style, previous)
    } else {
      patterns = []
      for (let instrument = 0; instrument < numInstruments; instrument++) {
        patterns.push(generate(instrument, steps, style, previous))
      }
    }
    return patterns
  }

  static midiFromPatterns(steps, patterns) {
    const notes = generateMidi(patterns, steps)
    globalPrevious = {notes, steps}


    //    const name = `Bacara Drums ${previous?'B':'A'} - ${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')}`
    const name = `Bacara Drums - ${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')}`

    const midiFile = new toneJSmidi.Midi()
    midiFile.name = name

    const track = midiFile.addTrack()

    track.name = name
    notes.forEach( (note, index) => {
      track.addNote(note.toTonalJsMidi())
    })

    if (writeMidiFiles) {
      const filepath = path.resolve((process.env.NODE_ENV == 'production') ? untildify(`~/.electra-one/state/bacara/${Drums.bankName(/*state*/)}/drums/${name.replace(/:/g, '.')}.mid`) : `${__dirname}/../state/bacara/${Drums.bankName(/*state*/)}/drums/${name.replace(/:/g, '.')}.mid`)
      fs.ensureDirSync(path.dirname(filepath))
      fs.writeFileSync(filepath, new Buffer.from(midiFile.toArray()))

      const midiData = fs.readFileSync(filepath)
      const midiJson = new toneJSmidi.Midi(midiData)
      return midiJson
    } else {
      return midiFile
    }
  }

  static instrumentName(instrument) {
    return (instrument >= 0 && instrument < numInstruments) ? (instruments[instrument]) : '??'
  }
}

module.exports = Drums
