const debug = require('yves').debugger(require('../package.json').name + ':' + (require('change-case').paramCase(require('path').basename(__filename, '.js'))).replace(/-/g, ':'))

const model = require('../training/drum.js')
const temperature = 1.0
const patternLength = 16
const maxContext = 32
const numInstruments = 12
const style = 'house'
const length = 16

const instruments = ['bd', 'sd', 'lt', 'mt', 'ht', 'rs', 'cp', 'cb', 'cy', 'oh', 'ch']

function Note(pitch, start, duration, velocity, muted) {
  this.Pitch = pitch
  this.Start = start
  this.Duration = duration
  this.Velocity = velocity
  this.Muted = muted
}


function generate(i,notes = null,length = 0) {
  const dict = model[style][i]
  let text = getTextToContinue(i,notes,length)
  const pattern = []

  while (pattern.length < patternLength) {
    if (((text.length - 1) % 5) === 4) {
      text = text + '-'
      continue
    }

    let context = text.slice(-maxContext)

    while (!{}.hasOwnProperty.call(dict,context)) {
      context = context.slice(1)
    }

    const dist = dict[context]
    let x = Math.random()

    for (let k in dist) {
      if ({}.hasOwnProperty.call(dist,k)) {
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

function getTextToContinue(i, previous) {
  if (i > 0 && previous) {
    const texts = getTextFromMidi(previous)
    return texts[i - 1]
  }

  return '^'
}

function getTextFromMidi(previous) {

  const {notes, length} = previous

  const instrumentValues = []
  const steps = []

  for (let i = 0; i < instruments.length; i++) {
    const instrument = instruments[i]
    const pitch = i
    const velLow = 64
    const velHigh = 96
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

  for (i = 0; i < instruments.length; i++) {
    let text = '^'
    for (let s = 0; s < (length * 4); s++) {
      if (s > 0 && (s % 4) === 0) {
        text += '-'
      }
      text += steps[i][s] || '0'
    }
    texts[i] = text
  }
  debug('texts %y',texts)
  return texts
}


function MYgenerateMidi(pattern) {
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
    const velLow = 64
    const velHigh = 96
    for (let s = 0; s < length; s++) {
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

function MYgenerateAll(previous) {
  const patterns = []
  for (let i = 0; i < numInstruments; i++) {
    patterns.push(generate(i,previous))
  }

//  console.dir(patterns)

  const notes = MYgenerateMidi(patterns)
//  console.dir(notes)
  return {notes,length}
}

/*console.log(model)*/
let gen1 = MYgenerateAll()
debug('gen 1 %y',gen1)

let gen2 = MYgenerateAll(gen1)

debug('gen 2 %y',gen2)