# BACARA SEQUENCER

The Bacara Sequencer is my attempt to create a "Parametric Sequencer", a sequencer that plays patterns, and leaves some hands-on control (parameters) while playing live. The focus is not so much on the actual notes, but more on their effect over time. Randomness plays a big role, but it tries to strike a balance between "too-chaotic" and "too-repetetive". So here goes...

## Pattern

The core pattern is (can be) generated (on-demand). A typical pattern is a 16 step (can be any length), generated based on a library of TB-303 (ABL3 actually) patterns, and re-generated using some clever AI techniques. All described here:

[Aicd](https://github.com/mganss/Aicd) by [Michael Ganss](https://github.com/mganss)

[The unreasonable effectiveness of Character-level Language Models](https://nbviewer.org/gist/yoavg/d76121dfde2618422139) by [Yoav Goldberg](http://www.cs.biu.ac.il/~yogo)

[The Unreasonable Effectiveness of Recurrent Neural Networks](https://karpathy.github.io/2015/05/21/rnn-effectiveness/) by [Andrej Karpathy](https://karpathy.github.io) on May 21, 2015

This allows for endless generations of patterns. Any time you press Generate, a new unique pattern is generated, and very often sound "good".

So these pattern can run, by clocking it to an external MIDI clock source. Now parameters are applied when playing it out (to MIDI):

- Transpose (can be bound to an external MIDI keyboard)
- Octave up/down chance
- Pattern density (randomness is kept)
- Note probability (randomness re-generated per note)
- Euclidian Mutes
- Gate (note length)
- Pattern shift (positive/negative)
- Scale Mode
- Scale Base
- Device (port/channel) split point (making it play on 2 distinct devices, A & B)
- Deviate is the chance (per note) that the determined (A or B) device will switch.

The patterns are stored as MIDI clips, so one could always use them directly in any DAW.

### Drums

With a very similar process as described above, a 11 track drum pattern can be generated, and assigned to a external Drum Machine.

### LFO

The Bacara Sequencer has 3 LFO's allowing to target any internal parameter, or, target any CC on ddevice A and/or B

### Modulation

The Bacara Sequencer has 3 modulation slots with 3 tagets each.

### Virtual MIDI

All patterns (melodic & drums) are also reflected on a "virtual MIDI port" called Bacara. So with that you can target any DAW hosted software synthesizer (VTS/AU/native). On the Bacara port, Devices A go to Bacara channel 1, Device B to Bacara channel 2, Drums to Bacara channel 10. So no hardware devices are actually required.

### Generating the Electra One preset.

Because a lot of things in this preset are very specific to your actual setup, a system of preset building is used here.

`electra-one preset --filename <preset-file> --custom <custom setup JSON>`

The custom JSON will list your devices & MIDI ports, so that it is reflected correctly in the generated preset.

(to be continued)