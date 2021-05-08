const acidTraining = require('../training/acid.js')

const fs = require('fs')
const path = require('path')
const glob = require('glob')
const toneJSmidi = require('@tonejs/midi')

const Table = require('cli-table3')
const chalk = require('chalk')
const { Midi } = require('@tonaljs/tonal')

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
    if ({}.hasOwnProperty.call(l,key)) {
      let v = l[key]
      dist[key] = (v / temperature) + 1.0 - (1.0 / temperature)
    }
  }
  let x = Math.random()
  for (let k in dist) {
    if ({}.hasOwnProperty.call(dist,k)) {
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
  generate(state) {
    const size = patternLength
    const steps = generatePattern(acidTraining, 18, size, (state && state.temperature) ? state.temperature : temperature)
    debug('generated: %y',steps)

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
    /*  track.addNote(0, step.note, 64, 0, step.accent ? 127 : velocity);*/

      if (!(!fixGate && step.gate === 0)) {
        if (lastStep && lastStep.note === step.note && lastStep.slide && (fixGate || lastStep.gate)) {
          // slide and same pitch as previous step -> extend duration of previous note
          if (step.slide && previousNote) {
            /*        console.log('hi', index)*/
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

    const name = `Bacara - Acid - ${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')}`

    const midiFile = new toneJSmidi.Midi()
    midiFile.name = name

    const track = midiFile.addTrack()

    track.name = name
    notes.forEach( note => track.addNote(note) )

    const filepath = `${__dirname}/../loops/acid/${name.replace(/:/g,'.')}.mid`
    fs.writeFileSync(filepath, new Buffer.from(midiFile.toArray()))

    const midiData = fs.readFileSync(filepath)
    const midiJson = new toneJSmidi.Midi(midiData)
    midiJson.tracks[0].instrument.number = 38

    //    debug('midiJson: %y',midiJson)
    state.size = size
    return midiJson
  },

  last(state) {

    const mids = {}
    const midiFiles = glob.sync(path.join(__dirname,'..','loops','acid') + '/*.mid', {})
    /*    console.dir(midiFiles)*/

    let but = (state ? state.lastBut : 0)
    if (!but) {
      but = 0
    }
    if (but < 0) {
      but = 0
    }
    if (but > (midiFiles.length - 1)) {
      but = midiFiles.length - 1
    }

    /*    debug('but: %y',but)*/
    const midiData = fs.readFileSync(midiFiles[(midiFiles.length - 1) - but])
    const midiJson = new toneJSmidi.Midi(midiData)

    //    debug('midiJson: %y',midiJson.header.name)

    return midiJson
  },

  table(state) {
    if (!state || !state.pattern) {
      return
    }
    const accentedColor = chalk.bgHex('#FF8800')
    const normalColor = chalk.bgHex('#00BB00')
    const disabledColor = chalk.bgHex('#666666')

    let table = new Table(
      {
        head: [
          'Device',
          'Notes',
          {colSpan:state.size,content:state.pattern.header.name + `     normal ${normalColor('  ')}   accented ${accentedColor('  ')}   disabled ${disabledColor('  ')}`}
        ]
        /*,style:{head:[],border:[]}*/
      }
    )

    /*    debug('pattern: %y',state.pattern)*/

    const notes = []
    state.pattern.tracks[0].notes.forEach( note => {
      if (notes.indexOf(note.midi) < 0) {
        notes.push(note.midi)
      }
    })
    notes.sort()
    notes.reverse()

    notes.forEach( noteMidi => {
      const noteMidiTransposed = noteMidi + state.transpose
      /*      debug('JJR: %y %y %y',(state && state.split && noteMidiTransposed <= state.split),state.split,noteMidiTransposed)*/
      const arr = [
        {hAlign:'center',content:(state && state.split && noteMidiTransposed <= state.split) ? ((state.deviate >= 50) ? 'B' : 'A') : ((state.deviate >= 50) ? 'A' : 'B') },
        {hAlign:'center',content:Midi.midiToNoteName(noteMidiTransposed - 12,{ sharps: true })/*+` ${noteMidi}`*/}
      ]
      for (let ticks = 0; ticks < (state.size * ticksPerStep); ticks += ticksPerStep) {
        let chNote = '  '
        state.pattern.tracks[0].notes.forEach( note => {
          if (note.midi  == noteMidi && note.ticks == ticks) {
            const count = Math.ceil(note.durationTicks / ticksPerStep)
//            debug('count: %y',count)
//            console.trace('JJR')
            const color = state.sounding[ticks / ticksPerStep] ? (note.velocity == 1 ? accentedColor : normalColor) : disabledColor
            const rep = count * 2 + ((count - 1) * 3)
            chNote = {colSpan:count,content:color(' '.repeat(rep>=0?rep:0))}
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


/*const midiData = fs.readFileSync("output.mid")
const midiJson = new toneJSmidi.Midi(midiData)
console.dir(midiJson, {
  depth: null
})
*/


/*var MidiPlayer = require('midi-player-js');
var Player = new MidiPlayer.Player(function(event) {
    console.log(event);
});
// Load a MIDI file
Player.loadFile('./output.mid');
Player.play();*/