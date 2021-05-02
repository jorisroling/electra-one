# electra-one
Tools for Electra One + Instrument Files for Virus TI and Router for Electra One <-> Virus TI

This **electra-one** package, is a toolset for my use-case with a Access Virus TI synthesizer and the Electra One MIDI controller. It contains the *Preset File* to be loaded into the Electra One. This will on itself allow for editing **Part 1** on the Access Virus TI. As there are many parameters just for 1 part (The Virus TI has 16 parts) all the available screens on the ELectra One (12) are needed just for this part alone. To overcome this limitation (only 1 part), I created this toolset, which copntains what I call a *router*, that will allow all remaining parts to be edited as well. Here is how it works:


## Prerequisites (as for [node-midi](https://github.com/justinlatimer/node-midi))

### OSX

* Some version of Xcode (or Command Line Tools)
* Python (for node-gyp)

### Windows

* Microsoft Visual C++ (the Express edition works fine)
* Python (for node-gyp)

### Linux

* A C++ compiler
* You must have installed and configured ALSA. Without it this module will **NOT** build.
* Install the libasound2-dev package.
* Python (for node-gyp)

## Initial setup

As this package is writen as a NodeJS module, the following initial setup is required:

- NodeJS is installed. The download + instructions can be found here: [https://nodejs.org/](https://nodejs.org/)
- Installing this toolset can be done by running `npm install -g electra-one` on the command line. This will fill the screen with lots of scary warnings. These are (hopefully) only related to the compiling of the native **node-midi module**. As long as it ends with `+ electra-one@x.x.x` you are good.

This has been tested on MacOS (on which I created this package), and on a Raspberry PI B+, which is where this toolset runs in my setup.


## Router

The router in the toolset has the following role, it (forth and back) *routes* the MIDI messages between the device (here synthesizer) and the Electra One. For the case of Access Virus TI, it also does some *Part Mapping*, in such a way, that by having a control on the screen of the Electra One, a **Part** (1-16) can be selected, and all the messages are mapped to this part, so that now the Electra One can edit the entire Access Virus TI. The router also for routing to and from other devices, this is bundled together as *actors* in a *scenario*, of which there can be many. The actual *Port Mapping*, is an option which can be enabled withing a scenario actor. If no transformation options are set, the routing will be straight (what-comes-in-will come-out).

### Router setup

To setup the routing for your specific setup, you'd want to edit the configuration file located here `config/default.js`. It containes the midi port names (as used on the system you are runnig the `electra-one` toolset one), and allows for different platform definitions (e.g. **darwin**, **linux** & **win32** as defined [here](https://nodejs.org/api/os.html#os_os_platform)).

It also containes to **scenario** setup, including the *default* one. Here you can list a number of *actors* per *scenario*, and per *actor* you can define:

- enabled **true** or **false** : if it should include (**true**) or ignore (**false**) this *actor*
- port **1** or **2** : the Electra One port to be used
- channels **[1-16]** : which channels should be included in the routing (non specified ones are ignored)
- portMap **"name"** : (optional) can be "virus-ti" for the Port Mapping of a Access Virus TI
- initialize : (optional) contains a set of initial (kick-off) sysex commands


### Router in action

To start routing enter `electra-one router`. This will run the router silently, no feedback is shown. If you like to see more action, enter `DEBUG=* electra-one router`, this will shows what is going on.

To terminate the routing process, simply type CTRL-C.

Enjoy! 😃