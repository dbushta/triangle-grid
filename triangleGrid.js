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
      this.menu =  null;
      this.xLength = 5;
      this.yLength = Math.sqrt(3) * this.xLength / 2;
      this.viewBox = null;
      this.maxZoom = null;
      /*Modes:{0: menu, 1: drag, 2: zoom, 3: place, 4: delete}*/
      this.mode = 1;
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
      this.viewBox = this.svg.viewBox.baseVal;
      this.viewBox.x -= this.viewBox.width / 2;
      this.viewBox.y -= this.viewBox.height / 2;
      //Remember for zooming
      this.maxZoom = {w: this.viewBox.width, h: this.viewBox.height};
      //Add origin circle; will be above other elements
      let circle = document.createElementNS(this.ns, "circle");
      circle.setAttributeNS(null, "id", "center");
      circle.setAttributeNS(null, "r", '2');
      this.svg.appendChild(circle);
      //Call preparation functions
      this.drawLines();
      this.setMenu();
      this.setPoints();
      this.setDrag();
      this.setZoom();
      this.updateSVG();
    }

    /*Method drawLines
     *Parameters: null
     *Description: Create horizontal and diagonal point pairs to create lines from
     *Return: null
     */
    drawLines() {
      this.grid.setAttributeNS(null, "id", "Grid");
      //How many whole y pattern lengths fit on grid
      const svgHeight = this.yLength * (intDivide(this.viewBox.height, this.yLength) + 3);
      //Find half of the whole x patterns across + 1(for guaranteed margin)
      const svgWidthHalf = this.xLength * (intDivide(this.viewBox.width, 2 * this.xLength) + 2);

      var pointPairs = [];
      //Create diagonal point pairs starting at half svgWidth
      for(let i = -svgWidthHalf; i <= 3 * svgWidthHalf; i += this.xLength) {
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
      for(let i = 0; i <= svgHeight; i += this.yLength) {
        pointPairs.push({
          p1: {x: 0, y: i},
          p2: {x: 2 * svgWidthHalf, y: i}
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

    /*Method setMenu
     *Parameters: null
     *Description: allow user to change modes
     *Return: null
     */
    setMenu() {
      const self = this;
      //group added here, so it is above everything else
      this.menu = svg.appendChild(document.createElementNS(this.ns, "g"));
      this.menu.setAttributeNS(null, "id", "Menu");

      let burgerButton = this.menu.appendChild(document.createElementNS(this.ns, "g"));
      burgerButton.setAttributeNS(null, "id", "burgerButton");

      let rect = document.createElementNS(this.ns, "rect");
      rect.setAttributeNS(null, "id", "burgerOuter");
      burgerButton.appendChild(rect);

      let text = document.createElementNS(this.ns, "text");
      text.setAttributeNS(null, "id", "burgerInner");
      text.setAttributeNS(null, "x", "7.5%");
      text.setAttributeNS(null, "y", "5%");

      let textNode = document.createTextNode("MENU");

      text.appendChild(textNode);
      burgerButton.appendChild(text);

      burgerButton.addEventListener("mousedown", openMenu);

      function openMenu(event) {
        if(!self.mode) return null;
        self.mode = 0;
        console.log("open menu");
      }

      function closeMenu(event) {
        if(!self.mode) return null;
        console.log("close menu");
      }

    }

    /*Method setPoints
     *Parameters: null
     *Description: add and remember points on svg
     *Return: null
     */
    setPoints() {
      const self = this;
      this.points.setAttributeNS(null, "id", "Points");

      this.svg.addEventListener("mousedown", createPoint);
      this.svg.addEventListener("mousedown", removePoint);

      function createPoint(event) {
        if(self.mode != 3) return null;
        console.log("add point");
      }
      function removePoint(event) {
        if(self.mode != 4) return null;
        console.log("remove point");
      }
    }

    /*Method setDrag
     *Parameters: null
     *Description:
     *Return: null
     */
    setDrag() {
      //Use closure to hold variables between eventListeners
      const self = this;
      var svgPt = this.svg.createSVGPoint();
      let dragging = false;
      let origin = {x:0, y:0};

      this.svg.addEventListener("mousedown", startDrag);
      this.svg.addEventListener("mousemove", midDrag);
      this.svg.addEventListener("mouseup", endDrag);
      this.svg.addEventListener("mouseleave", endDrag);

      function getSVGPoint(event) {
        svgPt.x = event.clientX;
        svgPt.y = event.clientY;
        return svgPt.matrixTransform(self.svg.getScreenCTM().inverse());
      }
      function startDrag(event) {
        if(self.mode != 1) return null;
        dragging = true;
        event.preventDefault();
        origin = getSVGPoint(event);
      }
      function midDrag(event) {
        if(dragging) {
          let now = getSVGPoint(event);
          self.viewBox.x -= (now.x - origin.x);
          self.viewBox.y -= (now.y - origin.y);
          self.updateSVG();
        }
      }
      function endDrag(event) {
        dragging = false;
      }
    }

    /*Method SetZoom
     *Parameter: null
     *Description: adjust position and scale of screen to zoom between [x,y]Length to maxZoom
     *Return: null
     */
    setZoom() {
      const self = this;
      this.svg.addEventListener("mousedown", zoom);

      function zoom(event) {
        if(self.mode != 2) return null;
        console.log("scroll");
      }
      /*let scale = percent / 100;
      //Bound the percent
      scale = (scale > 1) ? 1 : scale;
      scale = (scale < 0) ? 0 : scale;
      //Create the new scale width and height
      const newXZoom = this.xLength + (this.maxZoom.w - this.xLength) * scale;
      const newYZoom = this.yLength + (this.maxZoom.h - this.yLength) * scale;
      //Set values of viewBox with new scale width and heights
      this.viewBox.x += (this.viewBox.width - newXZoom) / 2;
      this.viewBox.y += (this.viewBox.height - newYZoom) / 2;
      this.viewBox.width = newXZoom;
      this.viewBox.height = newYZoom;
      this.updateSVG();*/
    }

    /*Method updateSVG
     *Parameters: null
     *Description: update state of svg viewBox, and reposition grid
     *Return: null
     */
    updateSVG() {
      const self = this;
      //Find the nearest whole x and y pattern length and move grid to it.
      this.grid.setAttribute("transform", `translate(
        ${this.xLength * intDivide(this.viewBox.x, this.xLength)},
        ${2 * this.yLength * intDivide(this.viewBox.y, 2 * this.yLength)}
      )`);
      //Keep the burger menu at bottom center
      this.menu.setAttribute("transform", `translate(
        ${this.viewBox.x + this.viewBox.width * 0.425},
        ${this.viewBox.y + this.viewBox.height * 0.90}
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
