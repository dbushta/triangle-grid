(function(global, factory) {
  if(false) {
    //Node
  } else if(false) {
    //AMD
  } else {
    //Add an object called triGrid to global with exports
    global = global || self;
    factory(global.triGrid = global.triGrid || {});
  }
}(this, function(exports) {
  "use strict"

  /*Class triangleGrid
   *Constructor: svg
   *Description: a class to control Triangle Grid through
   */
  class triangleGrid {
    constructor(svg) {
      this.svg = svg;
      this.ns = svg.getAttribute("xmlns");
      this.grid = svg.appendChild(document.createElementNS(this.ns, "g"));
      this.points = svg.appendChild(document.createElementNS(this.ns, "g"));
      this.xLength = 5;
      this.viewBox = null;
      this.maxZoom = null;
    }

    /*Function initialize
     *Parameters: null
     *Description: use/create a viewbox for svg, and prepare the svg.
     *Return: null
     */
    initialize() {
      //Check svg for viewBox
      var bBox = this.svg.getAttributeNS(null, "viewBox");
      if(!bBox) {
        //No viewBox, so create one that is one to one at origin.
        const dim = this.svg.getBoundingClientRect();
        bBox = `0 0 ${dim.width} ${dim.height}`;
        this.svg.setAttributeNS(null, "viewBox", bBox);
      }
      //take the substrings and create numbers using unary +
      this.viewBox = this.svg.viewBox.baseVal;
      this.viewBox.x -= this.viewBox.width / 2;
      this.viewBox.y -= this.viewBox.height / 2;
      this.maxZoom = {w: this.viewBox.width, h: this.viewBox.height};
      //Add origin circle; will be above other elements
      let circle = document.createElementNS(this.ns, "circle");
      circle.setAttributeNS(null, "id", "center");
      circle.setAttributeNS(null, "r", '2');
      circle.setAttributeNS(null, "stroke-width", '1');
      this.svg.appendChild(circle);
      //Call preparation functions
      this.drawLines();
      this.setDrag();
      //this.setZoom(50);
      this.updateSVG();
    }

    /*Method drawLines
     *Parameters: null
     *Description: Create horizontal and diagonal point pairs to create lines from
     *Return: null
     */
    drawLines() {
      //Triangle Height
      const h = this.xLength * Math.sqrt(3) / 2;
      //How many whole y pattern lengths fit on grid
      const svgHeight = h * (intDivide(this.viewBox.height, h) + 3);
      //Find half of the whole x patterns across + 1(for margin) and multiply by 2 to guarantee even
      const svgWidth = 2 * this.xLength * (intDivide(this.viewBox.width, 2 * this.xLength) + 1);

      var pointPairs = [];
      //Create diagonal point pairs starting at half svgWidth
      for(let i = -svgWidth / 2; i <= 3 * svgWidth; i += this.xLength) {
        pointPairs.push({
          p1: {x: i, y: 0},
          p2: {x: i + svgHeight / Math.sqrt(3), y: svgHeight}
        });
        pointPairs.push({
          p1: {x: i, y: 0},
          p2: {x: i - svgHeight / Math.sqrt(3), y: svgHeight}
        });
      }
      //Create horizontal point pairs
      for(let i = 0; i <= svgHeight; i += h) {
        pointPairs.push({
          p1: {x: 0, y: i},
          p2: {x: svgWidth, y: i}
        });
      }
      //Take create point pairs to make lines
      for(const pair of pointPairs) {
        let line = document.createElementNS(this.ns, "line");
        line.setAttributeNS(null, "x1", pair.p1.x);
        line.setAttributeNS(null, "x2", pair.p2.x);
        line.setAttributeNS(null, "y1", pair.p1.y);
        line.setAttributeNS(null, "y2", pair.p2.y);
        line.setAttributeNS(null, "stroke-width", '0.5');
        this.grid.appendChild(line);
      }
    }

    /*Method setDrag
     *Parameters: null
     *Description:
     *Return: null
     */
    setDrag() {
      //Use closure to hold variables between eventListeners
      const that = this;
      var svgPt = this.svg.createSVGPoint();
      let dragging = false;
      let origin = {x:0, y:0};

      this.svg.addEventListener("mousedown", startDrag);
      this.svg.addEventListener("mousemove", midDrag);
      this.svg.addEventListener("mouseup", endDrag);
      this.svg.addEventListener("mouseleave", endDrag);

      function getSVGPoint(point) {
        svgPt.x = point.clientX;
        svgPt.y = point.clientY;
        return svgPt.matrixTransform(that.svg.getScreenCTM().inverse());
      }
      function startDrag(e) {
        dragging = true;
        e.preventDefault();
        origin = getSVGPoint(e);
      }
      function midDrag(e) {
        if(dragging) {
          let now = getSVGPoint(e);
          that.viewBox.x -= (now.x - origin.x);
          that.viewBox.y -= (now.y - origin.y);
          that.updateSVG();
        }
      }
      function endDrag(e) {
        dragging = false;
      }
    }

    /*Method SetZoom
     *Parameter: Percent(number{0:100})
     *Description: adjust position and scale of screen to zoom between [x,y]Length to maxZoom
     *Return: null
     */
    setZoom(percent) {
      let scale = percent / 100;
      //Bound the percent
      scale = (scale > 1) ? 1 : scale;
      scale = (scale < 0) ? 0 : scale;
      //Create the new scale width and height
      const newXZoom = this.xLength + (this.maxZoom.w - this.xLength) * scale;
      const yLength = this.xLength * Math.sqrt(3) / 2;
      const newYZoom = yLength + (this.maxZoom.h - yLength) * scale;
      //Set values of viewBox with new scale width and heights
      this.viewBox.x += (this.viewBox.width - newXZoom) / 2;
      this.viewBox.y += (this.viewBox.height - newYZoom) / 2;
      this.viewBox.width = newXZoom;
      this.viewBox.height = newYZoom;
      this.updateSVG();
    }

    /*Method updateSVG
     *Parameters: null
     *Description: update state of svg viewBox, and reposition grid
     *Return: null
     */
    updateSVG() {
      //Two triangle heights is one y Pattern Length
      const yLength = this.xLength * Math.sqrt(3);
      //Find the nearest whole x and y pattern length and move grid to it.
      this.grid.setAttribute("transform", `translate(
        ${this.xLength * intDivide(this.viewBox.x, this.xLength)},
        ${yLength * intDivide(this.viewBox.y, yLength)}
      )`);
    }
  }

  /*Function intDivide
   *Parameters: numerator(number), denominator(number)
   *Description: Determine how many whole denominators are in numerator
   *Return: whole number
   */
  function intDivide(numer, denom) {
    return Math.floor(numer / denom);
  }

  //Fill global or exports depending on import method
  exports.triangleGrid = triangleGrid;
  exports.intDivide = intDivide;
}));
