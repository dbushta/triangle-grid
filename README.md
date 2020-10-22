# Triangle Grid #

## Table of Contents: ##
  - Installation
  - Usage
  - Contributing
  - Credits
  - License

### Installation ###
If you have the code locally, just use: `<script src="triangleGrid.js"></script>` in the body.</br>
The code should be importable through node and AMD(testing still)</br>

### Usage ###
Can use the grid as a background or to show visuals on a triangular grid.</br>
The triangleGrid html is there to show some ways to use the triGrid class.

### Contributing ###
Please test out the code in various browsers and operating systems, if ya find improvements or a bug, let me know.</br>
If ya want to make your own modules, make them, send a module name, username/contact, description and link to where its located and they will be put under contributed modules.</br>
#### A boiler plate module:</br> ####
```js
class moduleName {
  constructor(program) {
    //"program" refers to the triGrid instance
    //Push to modes to add a new Mode, if there are any
    program.addMode("modeName");
    //Add the group to toggle when mode changes, can be null
    program.applyModeMenu("modeName",
      program.createAndSetElement("g", program.scaledSVG, {id: "modeNameMenu"})
    );
    /*OR*/
    //Only one parameter and a group will be made for ya.
    program.applyModeMenu("modeName");
    //Change or add necessary attributes to triGrid
    program.attributeName = attributeName;
  },
  preparation(program) {
    //"program" refers to the triGrid instance.
  }
};
```

#### Contributed Modules ####
Please note that any modules that aren't hosted on this repository must use the GNU General Public License v3.0 license, to protect the module maker.

|Module|By|Description|Link|Compatability Issues|
|---|---|---|---|---|

### Credits ###
Waiting to receive permission to include the names of people who helped me learn javascript</br>
So far:</br>
  - [Aayush Yadav](https://github.com/aayux): inspiration for project
  - [Chris Till](https://github.com/chri55): markdown, ux, tester
  - [Jesse Thomas](https://github.com/JesseTCS): ux, tester

### License ###
GNU General Public License v3.0
