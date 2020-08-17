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
      /*Length of one triangle of the grid*/
      this.xLength = 5;
      /*Height of one triangle*/
      this.yLength = Math.sqrt(3) * this.xLength / 2;
      this.viewBox = this.svg.viewBox.baseVal;
      /*Used for zoom functions*/
      this.maxZoom = null;
      /*Modes:{0: menu, 1: drag, 2: zoom, 3: add, 4: remove}*/
      this.mode = 1;
    }

    /*Function initialize
     *Parameters: null
     *Description: use/create a viewbox for svg, and prepare the svg.
     *Return: null
     */
    initialize() {
      //Add start circle; will be above other elements
      let circle = document.createElementNS(this.ns, "circle");
      circle.setAttributeNS(null, "class", "center");
      circle.setAttributeNS(null, "r", '2');
      this.svg.appendChild(circle);
      /*Set viewBox to svg boundingClientRect so dimensions match,
        and preserveAspectRatio doesn't cause as many problems.
       */
      const dim = this.svg.getBoundingClientRect();
      const bBox = `0 0 ${dim.width} ${dim.height}`;
      this.svg.setAttributeNS(null, "viewBox", bBox);
      //Center the grid
      this.viewBox.x -= this.viewBox.width / 2;
      this.viewBox.y -= this.viewBox.height / 2;
      //Remember for zooming out to not go further than this
      this.maxZoom = {w: this.viewBox.width, h: this.viewBox.height};
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
      this.grid.setAttributeNS(null, "class", "Grid");
      /*length equation reasoning:
        use the longer side of the svg's viewBox, and evenly divide by 2 yLengths
        intDivide for integer to guarantee diagonals intersect cleanly at (0, 0)
        then multiply by 2 to guarantee length is an even number.
        Then by dividing by yLength(< xLength) and multiplying by xLength
        there will be extra grid space for the infinite illusion when dragging.
       */
      const length = intDivide(
        (this.viewBox.height > this.viewBox.width ? this.viewBox.height : this.viewBox.width),
        2 * this.yLength) * 2 * this.xLength;
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
      this.menu.setAttributeNS(null, "class", "menu");
      //Menu Button appearance
      let menuButton = this.menu.appendChild(document.createElementNS(this.ns, "g"));
      menuButton.setAttributeNS(null, "class", "menuButton");
      let menuButtonRect = document.createElementNS(this.ns, "rect");
      menuButtonRect.setAttributeNS(null, "class", "menuButtonRect");
      let menuButtonText = document.createElementNS(this.ns, "text");
      menuButtonText.setAttributeNS(null, "class", "menuText");
      menuButtonText.setAttributeNS(null, "x", "7.5%");
      menuButtonText.setAttributeNS(null, "y", "5%");
      menuButtonText.appendChild(document.createTextNode("MENU"));
      menuButton.appendChild(menuButtonRect);
      menuButton.appendChild(menuButtonText);
      //Inner button appearance, copy menu button and adjust values
      let options = ["DRAG", "ZOOM", "ADD", "REMOVE"];
      for(let i = 0, iLen = options.length; i < iLen; ++i) {
        let menuOption = menuButton.cloneNode(true);
        menuOption.childNodes[0].setAttributeNS(null, "x", "12.5%");
        menuOption.childNodes[0].setAttributeNS(null, "y", `${10 + 20 * i}%`);
        menuOption.childNodes[0].classList.toggle("controlMode");
        menuOption.childNodes[0].setAttributeNS("null", "data-number", `${i + 1}`);
        menuOption.childNodes[1].setAttributeNS(null, "x", "20%");
        menuOption.childNodes[1].setAttributeNS(null, "y", `${15 + 20 * i}%`);
        menuOption.childNodes[1].childNodes[0].nodeValue = options[i];
        this.menu.appendChild(menuOption);
      }

      let previousMode = 0;
      this.menu.addEventListener("mousedown", menuControl);

      function menuControl(event) {
        //Prevent behavior of the menuButton from setting mode to 0
        event.stopPropagation();
        //If going into menu, hold mode, else what mode was clicked on?
        if(self.mode) {
          previousMode = self.mode;
          self.mode = 0;
        } else {
          self.mode = event.target.classList.contains("controlMode") ?
            +event.target.dataset.number : previousMode;
        }
        //toggle the button to change appearance.
        menuButtonRect.classList.toggle("menuButtonExpanded");
        self.updateSVG();
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
      let start = {x:0, y:0};

      this.svg.addEventListener("mousedown", startDrag);
      this.svg.addEventListener("mousemove", midDrag);
      this.svg.addEventListener("mouseup", endDrag);
      this.svg.addEventListener("mouseleave", endDrag);
      //convert viewPort coordinates to viewBox coordinates
      function getSVGPoint(event) {
        svgPt.x = event.clientX;
        svgPt.y = event.clientY;
        return svgPt.matrixTransform(self.svg.getScreenCTM().inverse());
      }
      function startDrag(event) {
        if(self.mode != 1) return null;
        //Prevent accidental highlighting
        event.preventDefault();
        dragging = true;
        start = getSVGPoint(event);
      }
      function midDrag(event) {
        if(dragging) {
          let now = getSVGPoint(event);
          self.viewBox.x -= (now.x - start.x);
          self.viewBox.y -= (now.y - start.y);
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
      let zooming = false;
      let start = {x:0, y:0};

      this.svg.addEventListener("mousedown", startZoom);
      this.svg.addEventListener("mousemove", midZoom);
      this.svg.addEventListener("mouseup", endZoom);
      this.svg.addEventListener("mouseleave", endZoom);

      function getDistance(event) {
        return Math.sqrt(Math.pow(event.clientX - self.maxZoom.w / 2, 2),
          Math.pow(event.clientY - self.maxZoom.w / 2, 2));
      }
      function startZoom(event) {
        if(self.mode != 2) return null;
        //Prevent accidental highlighting
        event.preventDefault();
        zooming = true;
        start = getDistance(event);
      }
      function midZoom(event) {
        if(zooming) {
          let now = getDistance(event);
          self.viewBox.x += (now - start) / 4;
          self.viewBox.y += Math.sqrt(3) * (now - start) / 4;
          self.viewBox.width -= (now - start) / 2;
          self.viewBox.height -= Math.sqrt(3) * (now - start) / 2;
          start = now;
          console.log(self.viewBox);
          self.updateSVG();
        }
      }
      function endZoom(event) {
        zooming = false;
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

      this.svg.addEventListener("mousedown", addPoints);
      this.svg.addEventListener("mousedown", removePoints);

      function addPoints(event) {
        if(self.mode != 3) return null;
        console.log("ADD");
      }
      function removePoints(event) {
        if(self.mode != 4) return null;
        console.log("REMOVE");
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
      this.grid.setAttribute("transform", `translate(
        ${this.xLength * intDivide(this.viewBox.x, this.xLength)},
        ${2 * this.yLength * intDivide(this.viewBox.y, 2 * this.yLength)}
      )`);
      //Keep the menu button at bottom center
      this.menu.setAttribute("transform", `translate(
        ${this.viewBox.x + this.viewBox.width * (this.mode ? 0.425 : 0.3)},
        ${this.viewBox.y + this.viewBox.height * (this.mode ? 0.9 : 0.1)}
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
