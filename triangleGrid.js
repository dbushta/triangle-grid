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
      this.scaledSVG = this.createAndSetElement("svg", svg, {id:"scaledSVG"});
      this.grid = this.createAndSetElement("g", this.scaledSVG, {class: "gridGroup"});
      /*Length of one triangle of the grid*/
      this.xLength = triangleSideLength;
      /*Height of one triangle*/
      this.yLength = Math.sqrt(3) * this.xLength / 2;
      this.viewBox = null;
      this.maxZoom = null;
      /*modes for module controls*/
      this.modes = [];
      this.modeMenus = {};
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
      const viewBoxString = `0 0 ${dimensions.width} ${dimensions.height}`;
      this.staticSVG.setAttributeNS(null, "viewBox", viewBoxString);
      this.scaledSVG.setAttributeNS(null, "viewBox", viewBoxString);
      this.viewBox = this.scaledSVG.viewBox.baseVal;
      this.viewBox.width = dimensions.width;
      this.viewBox.height = dimensions.height;
      this.viewBox.x -= dimensions.width / 2;
      this.viewBox.y -= dimensions.height / 2;
      //Call preparation functions
      this.drawLines();
      if(!this.modules) return null;
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
        use the longer side of the svg's viewBox, and intDivide by 2 yLengths
        then multiply by 2 xLengths bc yLength < xLength so length is an even number
        and large enough for the infinite grid illusion to work when moving.
       */
      const length = this.intDivide(this.maxZoom.height > this.maxZoom.width ?
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
        this.createAndSetElement("line", this.grid, {x1: pair.p1.x, x2: pair.p2.x,
          y1: pair.p1.y, y2: pair.p2.y, style: "stroke: black; stroke-width: 0.5;"});
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
        ${this.xLength * this.intDivide(this.viewBox.x, this.xLength)},
        ${2 * this.yLength * this.intDivide(this.viewBox.y, 2 * this.yLength)})`);
    }

    /*Method intDivide
     *Parameters: numerator(number), denominator(number)
     *Description: Determine how many whole denominators are in numerator
     *Return: whole number
     */
    intDivide(numerator, denominator) {
      return Math.floor(numerator / denominator);
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
      //will always be the static svg
      let newPt = svgPt.matrixTransform(outerSVGs.pop().getScreenCTM().inverse());
      while(outerSVGs.length > 0) {
        const nextSVG = outerSVGs.pop().viewBox.baseVal;
        newPt.x *= nextSVG.width / this.maxZoom.width;
        newPt.y *= nextSVG.height / this.maxZoom.height;
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
      const y = this.intDivide(point.y, this.yLength);
      return {y: y, x: Math.floor(point.x / this.xLength - y / 2)};
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

  //Fill global or exports depending on import method
  exports.triangleGrid = triangleGrid;
  exports.__esModule = true;
}));
