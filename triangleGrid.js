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
      this.xLength = 10;
      this.viewBox = null
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
        //No viewBox, so create one that is one to one at origin using a domRect.
        const dim = this.svg.getBoundingClientRect();
        bBox = `0 0 ${dim.width} ${dim.height}`;
        this.svg.setAttributeNS(null, "viewBox", bBox);
      }
      bBox = bBox.split(' ');
      //take the substrings and create numbers using unary +
      this.viewBox = {x: +bBox[0], y: +bBox[1], w: +bBox[2], h: +bBox[3]};
      //Add origin circle; will be above other elements
      let circle = document.createElementNS(this.ns, "circle");
      circle.setAttributeNS(null, "id", "center");
      this.svg.appendChild(circle);
      //Call preparation functions
      this.drawLines();
      this.setDrag();
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
      const svgHeight = h * (intDivide(this.viewBox.h, h) + 3);
      //Find half of the whole x patterns across + 1(for margin) and multiply by 2 to guarantee even
      const svgWidth = 2 * this.xLength * (intDivide(this.viewBox.w, 2 * this.xLength) + 1);

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
      let dragging = false;
      let hold = {x:0, y:0};
      this.svg.addEventListener("mousedown", startDrag);
      this.svg.addEventListener("mousemove", midDrag);
      this.svg.addEventListener("mouseup", endDrag);
      this.svg.addEventListener("mouseleave", endDrag);

      function startDrag(e) {
        dragging = true;
        hold = {x:e.clientX, y:e.clientY};
      }
      function midDrag(e) {
        if(dragging) {
          that.viewBox.x -= e.clientX - hold.x;
          that.viewBox.y -= e.clientY - hold.y;
          hold = {x:e.clientX, y:e.clientY};
          that.updateSVG();
        }
      }
      function endDrag(e) {
        if(dragging) {
          midDrag(e);
          dragging = false;
        }
      }
    }
    
    /*Method SetZoom
     *
     */
    setZoom() {

    }

    /*Method updateSVG
     *Parameters: null
     *Description: update state of svg viewBox, and reposition grid
     *Return: null
     */
    updateSVG() {
      this.svg.setAttributeNS(null, "viewBox",
        `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.w} ${this.viewBox.h}`);
      //Two triangle heights is one y Pattern Length
      let yLength = this.xLength * Math.sqrt(3);
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
