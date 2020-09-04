(function(global, factory) {
  if(typeof module !== "undefined" && typeof exports !== "undefined") {
    factory(module.exports);
  } else if(typeof define === "function") {
    define(["exports"], factory);
  } else {
    typeof globalThis !== "undefined" ? globalThis : global || self;
    factory(global.triGrid = global.triGrid || {});
  }
}(this, function(exports) {
  "use strict";

  /*Class triangleGrid
   *Constructor: svg
   *Description: a class to control Triangle Grid through
   */
  class triangleGrid {
    constructor(svg, modules) {
      if(svg.tagName.toLowerCase() != "svg") throw "triangleGrid constructor failed, no svg given";
      this.nameSpace = "http://www.w3.org/2000/svg";
      this.staticSVG = svg;
      this.scaledSVG = svg.appendChild(document.createElementNS(this.nameSpace, "svg"));
      this.grid = this.scaledSVG.appendChild(document.createElementNS(this.nameSpace, "g"));
      this.grid.classList.add("grid");
      /*Length of one triangle of the grid*/
      this.xLength = 5;
      /*Height of one triangle*/
      this.yLength = Math.sqrt(3) * this.xLength / 2;
      this.viewBox = this.scaledSVG.viewBox.baseVal;
      /*Modes: MENU, DRAG, ZOOM, ADD, REMOVE*/
      this.maxZoom = null;
      this.mode = "MENU";
      this.modules = modules;
      this.initialize();
    }

    /*Function initialize
     *Parameters: null
     *Description: use/create a viewbox for svg, and prepare the svg.
     *Return: null
     */
    initialize() {
      //Add center circle; will be above other elements
      let circle = document.createElementNS(this.nameSpace, "circle");
      circle.classList.add("center");
      circle.setAttributeNS(null, "r", '2');
      this.scaledSVG.appendChild(circle);
      /*Set viewBox to svg boundingClientRect so dimensions match,
        and preserveAspectRatio doesn't cause as many problems.
       */
      const dimensions = this.staticSVG.getBoundingClientRect();
      //Remember max size before infinite grid illusion is broken
      this.maxZoom = {
        width: dimensions.width,
        height: dimensions.height,
        hypotenuse: Math.hypot(dimensions.height, dimensions.width)
      };
      //Center the grid
      this.staticSVG.setAttributeNS(null, "viewBox",
        `0 0 ${dimensions.width} ${dimensions.height}`);
      this.scaledSVG.setAttributeNS(null, "viewBox",
        `0 0 ${dimensions.width} ${dimensions.height}`);
      this.viewBox.width = dimensions.width;
      this.viewBox.height = dimensions.height;
      this.viewBox.x -= dimensions.width / 2;
      this.viewBox.y -= dimensions.height / 2;
      //Call preparation functions
      this.drawLines();
      this.updateSVG();
      for(const module of this.modules) {
        new module(this);
      }
    }

    /*Method drawLines
     *Parameters: null
     *Description: Create horizontal and diagonal point pairs to create lines from
     *Return: null
     */
    drawLines() {
      /*length equation reasoning:
        use the longer side of the svg's viewBox, and evenly divide by 2 yLengths
        intDivide for integer to guarantee diagonals intersect cleanly at (0, 0)
        then multiply by 2 to guarantee length is an even number.
        Then by dividing by yLength(< xLength) and multiplying by xLength
        there will be extra grid space for the infinite illusion when dragging.
       */
      const length = intDivide(this.viewBox.height > this.viewBox.width ?
        this.viewBox.height : this.viewBox.width, 2 * this.yLength
        ) * 2 * this.xLength;
      var pointPairs = [];
      /*Create diagonal point pairs starting at half a length(which is even) to the left.
        Length is the height of a right triangle, which is sqrt(3) times the base.
        Displace the second point by the triangle base, guaranteeing proper angle.
       */
      for(let i = -length / 2, iLen = 3 * length / 2; i <= iLen; i += this.xLength) {
        pointPairs.push({
          p1: {x: i, y: 0},
          p2: {x: i + length / Math.sqrt(3), y: length}
        });
        pointPairs.push({
          p1: {x: i, y: 0},
          p2: {x: i - length / Math.sqrt(3), y: length}
        });
      }
      //Create horizontal point pairs at yLength apart from each consecutive pair
      for(let i = 0; i <= length; i += this.yLength) {
        pointPairs.push({
          p1: {x: 0, y: i},
          p2: {x: length, y: i}
        });
      }
      //Take created point pairs to make lines
      for(const pair of pointPairs) {
        let line = document.createElementNS(this.nameSpace, "line");
        setAttributesNS(line, null,
          {"x1": pair.p1.x, "x2": pair.p2.x, "y1": pair.p1.y, "y2": pair.p2.y}
        );
        this.grid.appendChild(line);
      }
    }

    /*Method updateSVG
     *Parameters: null
     *Description: update state of svg viewBox, and reposition grid
     *Return: null
     */
    updateSVG() {
      const self = this;
      //Find the nearest whole x and y pattern length and move grid to it.
      this.grid.setAttributeNS(null, "transform", `translate(
        ${this.xLength * intDivide(this.viewBox.x, this.xLength)},
        ${2 * this.yLength * intDivide(this.viewBox.y, 2 * this.yLength)}
      )`);
    }
  }


  /*Method menuModule
   *Parameters: null
   *Description: install setMenu
   *Return: null
   */
  class menuModule {
    constructor(program) {
      program.menu = program.staticSVG.appendChild(document.createElementNS(program.nameSpace, "g"));
      program.menu.classList.add("menu");
      program.setMenu = this.setMenu;
      program.setMenu();
    }

    setMenu() {
      const self = this;
      //group added here, so it is above everything else
      this.menu.setAttributeNS(null, "transform", `translate(
        ${this.maxZoom.width * .3}, ${this.maxZoom.height * .05}
      )`);
      //Menu Button appearance
      let menuButton = this.menu.appendChild(document.createElementNS(this.nameSpace, "g"));
      menuButton.classList.add("menuButton");
      let menuButtonRect = document.createElementNS(this.nameSpace, "rect");
      menuButtonRect.classList.add("menuButtonRect");
      menuButton.appendChild(menuButtonRect);
      let menuButtonText = document.createElementNS(this.nameSpace, "text");
      menuButtonText.classList.add("menuButtonText");
      setAttributesNS(menuButtonText, null, {'x': "7.5%", 'y': "5%"});
      menuButtonText.appendChild(document.createTextNode("MENU"));
      menuButton.appendChild(menuButtonText);
      //Inner button appearance, copy menu button and adjust values
      let options = ["MOVE", "ZOOM", "ADD", "REMOVE"];
      for(let i = 0, iLen = options.length; i < iLen; ++i) {
        let menuOption = menuButton.cloneNode(true);
        menuOption.childNodes[0].classList.add("controlMode");
        setAttributesNS(menuOption.childNodes[0], null,
          {'x': "12.5%", 'y': `${10 + 20 * i}%`, "data-control": `${options[i]}`}
        );
        setAttributesNS(menuOption.childNodes[1], null, {'x': "20%", 'y': `${15 + 20 * i}%`});
        menuOption.childNodes[1].childNodes[0].nodeValue = options[i];
        this.menu.appendChild(menuOption);
      }

      menuButtonRect.classList.toggle("menuButtonExpanded");
      let previousMode = 0;
      this.menu.addEventListener("mousedown", menuControl);

      function menuControl(event) {
        //Prevent behavior of the menuButton from setting mode to 0
        event.stopPropagation();
        //If going into menu, hold mode, else what mode was clicked on?
        if(self.mode != "MENU") {
          previousMode = self.mode;
          self.mode = "MENU";
        } else {
          self.mode = event.target.classList.contains("controlMode") ?
            event.target.dataset.control : previousMode;
        }
        //toggle the button to change appearance.
        menuButtonRect.classList.toggle("menuButtonExpanded");
        self.menu.setAttributeNS(null, "transform", `translate(
          ${self.maxZoom.width * (self.mode != "MENU" ? .425 : .3)},
          ${self.maxZoom.height * (self.mode != "MENU" ? .9 : .05)}
        )`);
        self.updateSVG();
      }
    }
  }


  /*Class moveModule
   *Parameters: null
   *Description: install setMove
   *Return: null
   */
  class moveModule {
    constructor(program) {
      program.setMove = this.setMove;
      program.setMove();
    }

    setMove() {
      //Use closure to hold variables between eventListeners
      const self = this;
      var svgPt = this.scaledSVG.createSVGPoint();
      let moving = false;
      let start = {x: 0, y: 0};

      this.staticSVG.addEventListener("mousedown", startMove);
      this.staticSVG.addEventListener("mousemove", midMove);
      this.staticSVG.addEventListener("mouseup", endMove);
      this.staticSVG.addEventListener("mouseleave", endMove);
      //convert viewPort coordinates to viewBox coordinates
      function getSVGPoint(event) {
        svgPt.x = event.clientX;
        svgPt.y = event.clientY;
        return svgPt.matrixTransform(self.scaledSVG.getScreenCTM().inverse());
      }
      function startMove(event) {
        if(self.mode != "MOVE") return null;
        //Prevent accidental highlighting
        event.preventDefault();
        moving = true;
        start = getSVGPoint(event);
      }
      function midMove(event) {
        if(moving) {
          let now = getSVGPoint(event);
          self.viewBox.x -= (now.x - start.x);
          self.viewBox.y -= (now.y - start.y);
          self.updateSVG();
        }
      }
      function endMove(event) {
        moving = false;
      }
    }
  }


  /*Method zoomModule
   *Parameter: null
   *Description: install setZoom
   *Return: null
   */
  class zoomModule {
    constructor(program) {
      program.currentZoom = 1
      program.setZoom = this.setZoom;
      program.setZoom();
    }

    setZoom() {
      const self = this;
      var svgPt = this.scaledSVG.createSVGPoint();
      let zooming = false;
      let start = {x: 0, y: 0};

      this.staticSVG.addEventListener("mousedown", startZoom);
      this.staticSVG.addEventListener("mousemove", midZoom);
      this.staticSVG.addEventListener("mouseup", endZoom);
      this.staticSVG.addEventListener("mouseleave", endZoom);

      function getDistanceFromSVGCenter(event) {
        svgPt.x = event.clientX;
        svgPt.y = event.clientY;
        const newPt = svgPt.matrixTransform(self.scaledSVG.getScreenCTM().inverse());
        return Math.hypot(newPt.x - (self.viewBox.x + self.viewBox.width / 2),
          newPt.y - (self.viewBox.y + self.viewBox.height / 2));
      }
      function startZoom(event) {
        if(self.mode != "ZOOM") return null;
        //Prevent accidental highlighting
        event.preventDefault();
        zooming = true;
        start = getDistanceFromSVGCenter(event);
      }
      function midZoom(event) {
        if(zooming) {
          let now = getDistanceFromSVGCenter(event);
          //Zooming is negative.
          let hypotRatio = (now - start) / self.maxZoom.hypotenuse;
          if(self.currentZoom - hypotRatio > 1) {
            hypotRatio = self.currentZoom - 1;
          } else if(self.currentZoom - hypotRatio < .05) {
            hypotRatio = self.currentZoom - .05;
          }
          self.currentZoom -= hypotRatio;
          self.viewBox.x += self.maxZoom.width * hypotRatio / 2;
          self.viewBox.y += self.maxZoom.height * hypotRatio / 2;
          self.viewBox.width -= self.maxZoom.width * hypotRatio;
          self.viewBox.height -= self.maxZoom.height * hypotRatio;
          self.updateSVG();
        }
      }
      function endZoom(event) {
        zooming = false;
      }
    }
  }


  /*Method pointModule
   *Parameters: null
   *Description: install setPoints
   *Return: null
   */
  class pointModule {
    constructor(program) {
      program.points = program.scaledSVG.appendChild(document.createElementNS(program.nameSpace, "g"));
      program.points.classList.add("points");
      program.setPoints = this.setPoints;
      program.setPoints();
    }

    setPoints() {
      const self = this;
      var svgPt = this.scaledSVG.createSVGPoint();

      this.staticSVG.addEventListener("mousedown", addPoints);
      this.staticSVG.addEventListener("mousedown", removePoints);

      //convert viewPort coordinates to viewBox coordinates
      function getSVGPoint(event) {
        svgPt.x = event.clientX;
        svgPt.y = event.clientY;
        return svgPt.matrixTransform(self.scaledSVG.getScreenCTM().inverse());
      }
      function addPoints(event) {
        if(self.mode != "ADD") return null;
        let newPt = getSVGPoint(event);
        let yLengths = intDivide(newPt.y, self.yLength);
        let xLengths = Math.floor(newPt.x / self.xLength - yLengths / 2);

        let circle = document.createElementNS(self.nameSpace, "circle");
        setAttributesNS(circle, null, {
          'r': '2',
          'cx': self.xLength * (xLengths + yLengths / 2),
          'cy': yLengths * self.yLength
        });
        circle.classList.add("point");
        self.points.appendChild(circle);
      }
      function removePoints(event) {
        if(self.mode != "REMOVE") return null;
        if(!event.target.classList.contains("point")) return null;
        event.target.remove();
      }
    }
  }

  /*Function intDivide
   *Parameters: numerator(number), denominator(number)
   *Description: Determine how many whole denominators are in numerator
   *Return: whole number
   */
  function intDivide(numerator, denominator) {
    return Math.floor(numerator / denominator);
  }

  /*Function setAttributesNS
   *Parameters: element(svg object), nameSpace(string), attributes(object)
   *Description: take object of attributes and value and set in element
   *Return: null
   */
  function setAttributesNS(element, nameSpace, attributes) {
    for(const [key, value] of Object.entries(attributes)) {
      element.setAttributeNS(nameSpace, key, value);
    }
  }

  //Fill global or exports depending on import method
  exports.triangleGrid = triangleGrid;
  exports.menuModule = menuModule;
  exports.moveModule = moveModule;
  exports.zoomModule = zoomModule;
  exports.pointModule = pointModule;
  exports.intDivide = intDivide;
  exports.setAttributesNS = setAttributesNS;
  exports.__esModule = true;
}));
