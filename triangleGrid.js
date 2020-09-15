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
   *Constructor: svg(svg element), triangleSideLength(number), modules(object list)
   *Description: a class to control Triangle Grid through
   */
  class triangleGrid {
    constructor(svg, triangleSideLength = 5, modules = null) {
      if(svg.tagName.toLowerCase() != "svg")
        throw "triangleGrid constructor failed, 1st parameter, no svg given";
      if(typeof triangleSideLength != "number")
        throw "triangleGrid constructor failed, 2nd parameter, no number given";
      if(triangleSideLength <= 0)
        throw "triangleGrid constructor failed, 2nd parameter, must be positive";
      if(typeof modules != "object" && modules != null)
        throw "triangleGrid constructor failed, 3rd parameter, must be object list or undefined";

      this.nameSpace = "http://www.w3.org/2000/svg";
      this.staticSVG = svg;
      this.scaledSVG = createAndSetElement("svg", svg, this.nameSpace, null);
      this.grid = createAndSetElement("g", this.scaledSVG, this.nameSpace, {"class": "grid"});
      /*Length of one triangle of the grid*/
      this.xLength = triangleSideLength;
      /*Height of one triangle*/
      this.yLength = Math.sqrt(3) * this.xLength / 2;
      this.viewBox = this.scaledSVG.viewBox.baseVal;
      this.maxZoom = null;
      /*modes for module controls*/
      this.modes = [];
      this.currentMode = "null";
      this.modules = modules;
      this.initialize();
      this.updateSVG();
    }

    /*Function initialize
     *Parameters: null
     *Description: use/create a viewbox for svg, and prepare the svg.
     *Return: null
     */
    initialize() {
      /*Set viewBox to svg boundingClientRect so dimensions match,
        and preserveAspectRatio doesn't cause as many problems.
       */
      const dimensions = this.staticSVG.getBoundingClientRect();
      //Remember max size before infinite grid illusion is broken
      this.maxZoom = {
        width: dimensions.width,
        height: dimensions.height,
        hypotenuse: Math.hypot(dimensions.height, dimensions.width)};
      //Center the grid
      this.staticSVG.setAttributeNS(null, "viewBox",
        `0 0 ${dimensions.width} ${dimensions.height}`);
      this.viewBox.width = dimensions.width;
      this.viewBox.height = dimensions.height;
      this.viewBox.x -= dimensions.width / 2;
      this.viewBox.y -= dimensions.height / 2;
      //Call preparation functions
      this.drawLines();
      if(!this.modules) return null;
      for(const module of this.modules) {
        if(module.hasOwnProperty("necessities")) module.necessities(this);
      }
      for(const module of this.modules) {
        if(module.hasOwnProperty("preparation")) module.preparation.call(this);
      }
    }

    /*Method drawLines
     *Parameters: null
     *Description: Create horizontal and diagonal point pairs to create lines from
     *Return: null
     */
    drawLines() {
      /*length equation reasoning:
        use the longer side of the svg's viewBox, and intDivide by 2 yLengths
        then multiply by 2 xLengths bc yLength < xLength so length is an even number
        and large enough for the infinite grid illusion to work when moving.
       */
      const length = intDivide(this.maxZoom.height > this.maxZoom.width ?
        this.maxZoom.height : this.maxZoom.width, 2 * this.yLength) * 2 * this.xLength;
      var pointPairs = [];
      /*Create diagonal point pairs starting at half a length(which is even) to the left.
        Length is the height of a right triangle, which is sqrt(3) times the base.
        Displace the second point by the triangle base, guaranteeing proper angle.
       */
      for(let i = -length / 2, iLen = 3 * length / 2; i <= iLen; i += this.xLength) {
        pointPairs.push({
          p1: {x: i, y: 0},
          p2: {x: i + length / Math.sqrt(3), y: length}});
        pointPairs.push({
          p1: {x: i, y: 0},
          p2: {x: i - length / Math.sqrt(3), y: length}});
      }
      //Create horizontal point pairs at yLength apart from each consecutive pair
      for(let i = 0; i <= length; i += this.yLength) {
        pointPairs.push({
          p1: {x: 0, y: i},
          p2: {x: length, y: i}});
      }
      //Take created point pairs to make lines
      for(const pair of pointPairs) {
        createAndSetElement("line", this.grid, this.nameSpace,
          {"class": "gridLine", "x1": pair.p1.x, "x2": pair.p2.x, "y1": pair.p1.y, "y2": pair.p2.y});
      }
    }

    /*Method updateSVG
     *Parameters: null
     *Description: update state of svg viewBox, and reposition grid
     *Return: null
     */
    updateSVG() {
      //Find the nearest whole x and y pattern length and move grid to it.
      this.grid.setAttributeNS(null, "transform", `translate(
        ${this.xLength * intDivide(this.viewBox.x, this.xLength)},
        ${2 * this.yLength * intDivide(this.viewBox.y, 2 * this.yLength)})`);
    }
  }


  /*object moduleMenu
   *Parameters: null
   *Description: install menu mode
   *Return: null
   */
  const moduleMenu = {
    necessities: function(program) {
      program.menu = createAndSetElement("g", program.staticSVG, program.nameSpace, {
        "class": "menu", "transform": `translate(${program.maxZoom.width * .25}, 0)`});
      program.currentMode = "MENU";
    },

    preparation: function() {
      //Retain this list to hide and show the menu
      let toggleable = [createAndSetElement("rect", this.menu, this.nameSpace,
        {"class": "menuBackground hideElement", "width": "50%", "height": "100%"})];
      //create svg to store all to be made mode buttons
      let menuSVG = createAndSetElement("svg", this.menu, this.nameSpace, {
        "class": "menu", "width": "50%",
        "viewBox": `0 0 ${this.maxZoom.width * .5} ${this.maxZoom.height * .9}`});
      let menuViewBox = menuSVG.viewBox.baseVal;
      //create open menu button
      const menuButton = createAndSetElement("g", this.menu, this.nameSpace, {
        "transform": `translate(${this.maxZoom.width * .125}, ${this.maxZoom.height * .9})`});
      toggleable.push(menuButton);
      createAndSetElement("rect", menuButton, this.nameSpace, {"data-mode": "MENU",
        "class": "menuBackground menuOption menuButtonHover", "width": "25%", "height": "10%"});
      createAndSetElement("text", menuButton, this.nameSpace,
        {"class": "menuButtonText", 'x': "12.5%", 'y': "5%"}
      ).appendChild(document.createTextNode(this.currentMode));
      //Create each mode button in menu
      for(let i = 0, iLen = this.modes.length; i < iLen; ++i) {
        const menuOption = createAndSetElement("g", menuSVG, this.nameSpace, {
          "class" :"hideElement", "transform": `translate(
          ${this.maxZoom.width * .125}, ${this.maxZoom.height * (1 + i) * .15})`});
        toggleable.push(menuOption);
        createAndSetElement("rect", menuOption, this.nameSpace, {"data-mode": this.modes[i],
          "class": "menuBackground menuOption menuButtonHover", "width": "50%", "height": "10%"});
        createAndSetElement("text", menuOption, this.nameSpace,
          {"class": "menuButtonText", 'x': "25%", 'y': "5%"}
          ).appendChild(document.createTextNode(this.modes[i]));
      }

      const maxScroll = this.maxZoom.height * (this.modes.length - 4) * .15;

      this.menu.addEventListener("click", menuControl);
      this.menu.addEventListener("mousedown", menuSlideStart);
      this.menu.addEventListener("mousemove", menuSliding);
      this.menu.addEventListener("mouseup", menuSlideEnd);
      this.menu.addEventListener("mouseleave", menuSlideEnd);

      const self = this;
      let sliding = false;
      let start = null;

      function menuControl(event) {
        if(!event.target.classList.contains("menuOption")) return null;
        self.currentMode = event.target.dataset.mode;
        menuButton.childNodes[1].childNodes[0].nodeValue = self.currentMode;
        for(const element of toggleable) element.classList.toggle("hideElement");
      }
      function menuSlideStart(event) {
        //Prevent mousedown events on other SVGs
        event.stopPropagation();
        if(self.currentMode != "MENU") return null;
        sliding = true;
        start = transformToSVGPoint(menuSVG, event);
      }
      function menuSliding(event) {
        if(sliding) {
          let now = transformToSVGPoint(menuSVG, event);
          let change = menuViewBox.y - (now.y - start.y);
          //Make sure not to lose the mode buttons
          if(change < 0) change = 0;
          else if(change > maxScroll) change = maxScroll;
          menuViewBox.y = change;
          self.updateSVG();
        }
      }
      function menuSlideEnd(event) {
        sliding = false;
      }
    }
  };


  /*object moduleMove
   *Parameters: null
   *Description: install move mode
   *Return: null
   */
  const moduleMove = {
    necessities: function(program) {
      program.modes.push("MOVE");
    },

    preparation: function() {
      //Use closure to hold variables between eventListeners
      const self = this;
      let moving = false;
      let start = null;

      this.staticSVG.addEventListener("mousedown", gridMoveStart);
      this.staticSVG.addEventListener("mousemove", gridMoving);
      this.staticSVG.addEventListener("mouseup", gridMoveEnd);
      this.staticSVG.addEventListener("mouseleave", gridMoveEnd);

      function gridMoveStart(event) {
        if(self.currentMode != "MOVE") return null;
        //Prevent accidental highlighting
        event.preventDefault();
        moving = true;
        start = transformToSVGPoint(self.scaledSVG, event);
      }
      function gridMoving(event) {
        if(moving) {
          let now = transformToSVGPoint(self.scaledSVG, event);
          self.viewBox.x -= (now.x - start.x);
          self.viewBox.y -= (now.y - start.y);
          self.updateSVG();
        }
      }
      function gridMoveEnd(event) {
        moving = false;
      }
    }
  };


  /*Object moduleZoom
   *Parameter: null
   *Description: install zoom mode
   *Return: null
   */
  const moduleZoom = {
    necessities: function(program) {
      //.05 to 1 maxZoom
      program.currentZoom = 1;
      program.modes.push("ZOOM");
    },

    preparation: function() {
      const self = this;
      let zooming = false;
      let start = 0;

      this.staticSVG.addEventListener("mousedown", gridZoomStart);
      this.staticSVG.addEventListener("mousemove", gridZooming);
      this.staticSVG.addEventListener("mouseup", gridZoomEnd);
      this.staticSVG.addEventListener("mouseleave", gridZoomEnd);

      //get distance from current screen center.
      function getDistanceFromSVGCenter(event) {
        const newPt = transformToSVGPoint(self.scaledSVG, event);
        return Math.hypot(newPt.x - (self.viewBox.x + self.viewBox.width / 2),
          newPt.y - (self.viewBox.y + self.viewBox.height / 2));
      }
      function gridZoomStart(event) {
        if(self.currentMode != "ZOOM") return null;
        //Prevent accidental highlighting
        event.preventDefault();
        zooming = true;
        start = getDistanceFromSVGCenter(event);
      }
      function gridZooming(event) {
        if(zooming) {
          let now = getDistanceFromSVGCenter(event);
          let hypotRatio = (now - start) / self.maxZoom.hypotenuse;
          //Retain zoom bounds
          if(self.currentZoom - hypotRatio > 1) {
            hypotRatio = self.currentZoom - 1;
          } else if(self.currentZoom - hypotRatio < .05) {
            hypotRatio = self.currentZoom - .05;
          }
          self.currentZoom -= hypotRatio;
          //Make sure to move viewBox while scaling to keep centered
          self.viewBox.x += self.maxZoom.width * hypotRatio / 2;
          self.viewBox.y += self.maxZoom.height * hypotRatio / 2;
          self.viewBox.width -= self.maxZoom.width * hypotRatio;
          self.viewBox.height -= self.maxZoom.height * hypotRatio;
          self.updateSVG();
        }
      }
      function gridZoomEnd(event) {
        zooming = false;
      }
    }
  };


  /*Method modulePoints
   *Parameters: null
   *Description: install setPoints
   *Return: null
   */
  const modulePoints = {
    necessities: function(program) {
      program.points = createAndSetElement("g", program.scaledSVG, program.nameSpace,
        {"class": "points"});
      program.modes.push("ADD", "REMOVE");
    },

    preparation: function() {
      const self = this;

      this.staticSVG.addEventListener("mousedown", addPoints);
      this.staticSVG.addEventListener("mousedown", removePoints);

      function addPoints(event) {
        if(self.currentMode != "ADD") return null;
        //convert mouse coordinates to svg coordinates to nearest grid coordinate.
        let newPt = transformToSVGPoint(self.scaledSVG, event);
        let yLengths = intDivide(newPt.y, self.yLength);
        let xLengths = Math.floor(newPt.x / self.xLength - yLengths / 2);

        let circle = createAndSetElement("circle", self.points, self.nameSpace,
          {'r': '2', "cx": self.xLength * (xLengths + yLengths / 2),
          "cy": yLengths * self.yLength, "class": "point"});
        self.points.appendChild(circle);
      }
      function removePoints(event) {
        if(self.currentMode != "REMOVE") return null;
        if(event.target.classList.contains("point")) event.target.remove();
      }
    }
  };

  /*bbject moduleCenterMarker
   *Parameters: null
   *Description: Add a circle to 0, 0 on the grid.
   *return null
   */
  const moduleCenterMarker = {
    preparation: function() {
      createAndSetElement("circle", this.scaledSVG, this.nameSpace,
        {"class": "centerCircle", 'r': 2});
    }
  };

  /*Function intDivide
   *Parameters: numerator(number), denominator(number)
   *Description: Determine how many whole denominators are in numerator
   *Return: whole number
   */
  function intDivide(numerator, denominator) {
    return Math.floor(numerator / denominator);
  }

  /*Function createAndSetElement
   *Parameters: elementName(string), nameSpace(string), attributes(object)
   *Description: create Element then use setAttributesNS to ready.
   *Return: newly created and appended element.
   */
  function createAndSetElement(elementName, parentElement, nameSpace, attributes) {
    let newElement = document.createElementNS(nameSpace, elementName);
    setAttributesNS(newElement, null, attributes);
    parentElement.appendChild(newElement);
    return newElement;
  }

  /*Function setAttributesNS
   *Parameters: element(svg object), nameSpace(string), attributes(object)
   *Description: take object of attributes and value and set in element
   *Return: null
   */
  function setAttributesNS(element, nameSpace, attributes) {
    if(!attributes) return null;
    for(const [key, value] of Object.entries(attributes)) {
      element.setAttributeNS(nameSpace, key, value);
    }
  }

  /*Function transformToSVGPoint
   *Parameters: svg(svg element), point(event or object with x, y)
   *Description: tke points and convert to svg coordinates
   *Return: newly created point
   */
  function transformToSVGPoint(svg, point) {
    var svgPt = svg.createSVGPoint();
    svgPt.x = point.clientX || point.x;
    svgPt.y = point.clientY || point.y;
    return svgPt.matrixTransform(svg.getScreenCTM().inverse());
  }

  //Fill global or exports depending on import method
  exports.triangleGrid = triangleGrid;
  exports.moduleMenu = moduleMenu;
  exports.moduleMove = moduleMove;
  exports.moduleZoom = moduleZoom;
  exports.modulePoints = modulePoints;
  exports.moduleCenterMarker = moduleCenterMarker;
  exports.intDivide = intDivide;
  exports.createAndSetElement = createAndSetElement;
  exports.setAttributesNS = setAttributesNS;
  exports.transformToSVGPoint = transformToSVGPoint
  exports.__esModule = true;
}));
