(function(global, factory) {
  if(typeof module !== "undefined" && typeof exports !== "undefined") {//Ceck if in Node.js
    factory(module.exports);
  } else if(typeof define === "function") {//CHeck if importing with AMD
    define(["exports"], factory);
  } else {//Through HTML script tag
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
    constructor(svg, triangleSideLength = 5, modules = null, mode = null) {
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
      const sVGDimensions = this.staticSVG.getBoundingClientRect();
      this.scaledSVG = this.createAndSetElement("svg", svg,
        {id:"scaledSVG", width:sVGDimensions.width, height:sVGDimensions.height});
      this.transform = new sVGViewBoxController(this.scaledSVG);
      this.grid = this.createAndSetElement("g", this.scaledSVG, {class:"gridGroup"});
      /*Length of one triangle of the grid*/
      this.xLength = triangleSideLength;
      /*Height of one triangle*/
      this.yLength = Math.sqrt(3) * this.xLength / 2;

      /*Main controller for basic transforms on svg*/
      /*modes for module controls*/
      this.modes = [];
      this.modeMenus = {};
      this.currentMode = mode;
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
      /*const dimensions = this.staticSVG.getBoundingClientRect();
      //Remember max size before infinite grid illusion is broken
      this.transform.maxZoom = {
        width: dimensions.width,
        height: dimensions.height,
        hypotenuse: Math.hypot(dimensions.height, dimensions.width)};
      //Center the grid
      const viewBoxString = `0 0 ${dimensions.width} ${dimensions.height}`;
      this.staticSVG.setAttributeNS(null, "viewBox", viewBoxString);
      this.scaledSVG.setAttributeNS(null, "viewBox", viewBoxString);
      this.transform._viewBox = this.scaledSVG.viewBox.baseVal;*/
      this.transform.moveBy({x: this.transform.maxZoom.width / 2, y: this.transform.maxZoom.height / 2});

      this.drawLines();
      if(!this.modules) return null;
      //Create and call preparation functions
      for(let i = 0; i < this.modules.length; i++) this.modules[i] = new this.modules[i](this);
      for(const module of this.modules) module.preparation(this);
    }


    /*Method drawLines
     *Parameters: null
     *Description: Create horizontal and diagonal point pairs to create lines from
     *Return: null
     */
    drawLines() {
      /*length equation reasoning:
        use the longer side of the svg's viewBox, and floor divide by 2 yLengths
        then multiply by 2 xLengths bc yLength < xLength so length is an even number
        and large enough for the infinite grid illusion to work when moving.
       */
      const length = Math.floor(
        (this.transform.maxZoom.height > this.transform.maxZoom.width ?
        this.transform.maxZoom.height : this.transform.maxZoom.width) /
        (2 * this.yLength)) * 2 * this.xLength;
        console.log(this.transform.maxZoom.height, this.transform.maxZoom.width, length);
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
        let newLine = this.createAndSetElement("line", this.grid, {
          x1: pair.p1.x, x2: pair.p2.x, y1: pair.p1.y, y2: pair.p2.y});
        this.setStyle(newLine, {stroke:"black", "stroke-width":0.5});
      }
    }


    /*Method addMode
     *Paramaters: modeString(string) - name of the mode.
     *Description: Add if it doesn't have the mode.
     *Return: null
     */
    addMode(modeString) {
      if(!this.modes.includes(modeString)) {
        this.modes.push(modeString);
      }
    }


    /*Method applyModeMenu
     *Parameters: modeString(string) - name of mode associated with group Object.
     *            modeGroup(group element) - group element to hold menu elements or null.
     *Description: set the modeMenu to a group if there isn't one.
     *Return: the current modeMenu for modeString.
     */
    applyModeMenu(modeString, modeGroup) {
      //No menu added for this mode yet, add it.
      if(!this.modeMenus.hasOwnProperty(modeString)) {
        //No provided g element, make a new one.
        if(!modeGroup) {
          modeGroup = this.createAndSetElement("g", this.staticSVG, {id:`${modeString}Menu`});
        }
        this.modeMenus[modeString] = modeGroup;
      }
      return this.modeMenus[modeString];
    }


    /*Method updateSVG
     *Parameters: null
     *Description: update state of svg viewBox, and reposition grid
     *Return: null
     */
    updateSVG() {
      //Find the nearest whole x and y pattern length and move grid to it.
      this.grid.setAttributeNS(null, "transform", `translate(
        ${this.xLength * Math.floor(this.transform._viewBox.x / this.xLength)},
        ${2 * this.yLength * Math.floor(this.transform._viewBox.y / (2 * this.yLength))})`);
    }


    /*Method createAndSetTextElement
     *Parameters: elementName(string), nameSpace(string), attributes(object)
     *Description: use createAndSetElement then append a textNode.
     *Return: newly created and appended element.
     */
    createAndSetTextElement(elementText, parentElement, attributes) {
      let newTextElement = this.createAndSetElement("text", parentElement, attributes);
      newTextElement.appendChild(document.createTextNode(elementText));
      return newTextElement;
    }


    /*Method createAndSetElement
     *Parameters: elementName(string), nameSpace(string), attributes(object)
     *Description: create Element then use setAttributesNS to ready.
     *Return: newly created and appended element.
     */
    createAndSetElement(elementName, parentElement, attributes) {
      let newElement = document.createElementNS(this.nameSpace, elementName);
      this.setAttributesNS(newElement, attributes);
      parentElement.appendChild(newElement);
      return newElement;
    }


    /*Method setAttributesNS
     *Parameters: element(svg object), nameSpace(string), attributes(object)
     *Description: take object of attributes and value and set in element
     *Return: null
     */
    setAttributesNS(element, attributes) {
      if(!attributes) return null;
      for(const [key, value] of Object.entries(attributes)) {
        element.setAttributeNS(null, key, value);
      }
    }


    /*Method setStyle
     *Parameters: element(svg object), styles(object)
     *Description: take object of attributes and value and set in element
     *Return: null
     */
    setStyle(element, styles) {
      if(!styles) return null;
      for(const [key, value] of Object.entries(styles)) {
        element.style[key] = value;
      }
    }


    /*Method addEventListeners
     *Parameters: element, [{type: string, handler: function}, ...]
     *Description: take object of attributes and value and set in element
     *Return: null
     */
    addEventListeners(element, listeners) {
      for(const listener of listeners) {
        element.addEventListener(listener.type, listener.handler);
      }
    }


    /*Method transformToSVGPoint
     *Parameters: svg(svg element), point(event with clientX, clientY or object with x, y)
     *Description: take point and convert to svg coordinates, by applying each parent svg viewbox
     *Return: newly created point
     */
    transformToSVGPoint(svg, point) {
      let svgPt = svg.createSVGPoint();
      svgPt.x = point.clientX || point.x;
      svgPt.y = point.clientY || point.y;
      let outerSVGs = [];
      while(svg) {
        if(svg.tagName.toLowerCase() == "svg") outerSVGs.push(svg);
        svg = svg.parentElement;
      }
      //will always be the static svg, pls note fails when svg has x, y attributes,
      //also fails if there is any transforms along the way.
      //This is only necessary in Firefox.
      let newPt = svgPt.matrixTransform(outerSVGs.pop().getScreenCTM().inverse());
      while(outerSVGs.length > 0) {
        const nextSVG = outerSVGs.pop().viewBox.baseVal;
        newPt.x *= nextSVG.width / this.transform.maxZoom.width;
        newPt.y *= nextSVG.height / this.transform.maxZoom.height;
        newPt.x += nextSVG.x;
        newPt.y += nextSVG.y;
      }
      return newPt;
    }


    /*Method nearestGridPoint
     *Parameters: SVG point(x, y)
     *Description: take svg point and convert to grid coordinates
     *Return: newly created point
     */
    nearestGridPoint(point) {
      const y = Math.round(point.y / this.yLength);
      return {y: y, x: Math.round(point.x / this.xLength - y / 2)};
    }


    /*Method gridToSVGPoint
     *Parameters: grid point(x, y)
     *Description: take grid point and convert to svg coordinates
     *Return: newly created point
     */
    gridToSVGPoint(point) {
      return {x: this.xLength * (point.x + point.y / 2), y: point.y * this.yLength};
    }
  }

  /*Class sVGViewBoxController
   *Parameters: sVG(svg) - to control viewBox of
   *Description: maintain viewBox for svg move and zoom.
   */
  class sVGViewBoxController {
    constructor(sVG) {
      this.sVG = sVG;
      this.currentZoom = 0;
      const width = +this.sVG.getAttribute("width");
      const height = +this.sVG.getAttribute("height");
      sVG.setAttributeNS(null, "viewBox", `0 0 ${width} ${height}`);
      this.maxZoom = {width:width, height:height, hypotenuse:Math.hypot(width, height)};
      this._viewBox = this.sVG.viewBox.baseVal;
      this._moveDisplacement = {x:0, y:0};
      this._zoomDisplacement = {x:0, y:0};
    }

    //convert to set move
    moveBy(vector) {
      this.move = {x:this._moveDisplacement.x - vector.x,
        y:this._moveDisplacement.y - vector.y};
    }

    //store displacement, and update viewBox
    set move(coordinates) {
      this._moveDisplacement.x = coordinates.x;
      this._moveDisplacement.y = coordinates.y;
      this._viewBox.x = this._moveDisplacement.x + this._zoomDisplacement.x;
      this._viewBox.y = this._moveDisplacement.y + this._zoomDisplacement.y;
    }

    //convert to set zoom
    zoomBy(percent) {
      this.zoom = this.currentZoom + percent;
    }

    //store zoom Displacement, and update viewBox.
    set zoom(percent) {
      this.currentZoom = percent;
      this._zoomDisplacement.x = (1 - this.currentZoom) * this.maxZoom.width / 2;
      this._zoomDisplacement.y = (1 - this.currentZoom) * this.maxZoom.height / 2;
      this._viewBox.x = this._moveDisplacement.x + this._zoomDisplacement.x;
      this._viewBox.y = this._moveDisplacement.y + this._zoomDisplacement.y;
      this._viewBox.width = this.currentZoom * this.maxZoom.width;
      this._viewBox.height = this.currentZoom * this.maxZoom.height;
    }
  }

  //Fill global or exports depending on import method
  exports.triangleGrid = triangleGrid;
  exports.sVGViewBoxController = sVGViewBoxController;
  exports.__esModule = true;
}));
