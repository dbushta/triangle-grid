//Absolutely requires triangleGrid.js

(function(global, factory) {
  if(typeof module !== "undefined" && typeof exports !== "undefined") {
    factory(module.exports);
  } else if(typeof define === "function") {
    define(["exports"], factory);
  } else {
    typeof globalThis !== "undefined" ? globalThis : global || self;
    factory(global.modules = global.modules || {});
  }
}(this, function(exports) {
  "use strict";

  /*object moduleMenu
   *Parameters: null
   *Description: install menu mode
   *Return: null
   */
  const moduleMenu = {
    necessities: function(program) {
      program.menu = program.createAndSetElement("g", program.staticSVG, {
        "class": "menu", "transform": `translate(${program.maxZoom.width * .25}, 0)`});
      program.currentMode = "MENU";
    },

    preparation: function() {
      //Retain this list to hide and show the menu
      let toggleable = [this.createAndSetElement("rect", this.menu,
        {"class": "menuBackground hideElement", "width": "50%", "height": "100%"})];
      //create svg to store all to be made mode buttons
      let menuSVG = this.createAndSetElement("svg", this.menu, {"class": "menu", "width": "50%",
        "viewBox": `0 0 ${this.maxZoom.width * .5} ${this.maxZoom.height * .9}`});
      let menuViewBox = menuSVG.viewBox.baseVal;
      //create open menu button
      const menuButton = this.createAndSetElement("g", this.menu, {
        "transform": `translate(${this.maxZoom.width * .125}, ${this.maxZoom.height * .9})`});
      toggleable.push(menuButton);
      this.createAndSetElement("rect", menuButton, {"data-mode": "MENU",
        "class": "menuBackground menuOption menuButtonHover", "width": "25%", "height": "10%"});
      this.createAndSetElement("text", menuButton,
        {"class": "menuButtonText", 'x': "12.5%", 'y': "5%"}
      ).appendChild(document.createTextNode(this.currentMode));
      //Create each mode button in menu
      for(let i = 0, iLen = this.modes.length; i < iLen; ++i) {
        const menuOption = this.createAndSetElement("g", menuSVG, {
          "class" :"hideElement", "transform": `translate(
          ${this.maxZoom.width * .125}, ${this.maxZoom.height * (1 + i) * .15})`});
        toggleable.push(menuOption);
        this.createAndSetElement("rect", menuOption, {"data-mode": this.modes[i],
          "class": "menuBackground menuOption menuButtonHover", "width": "50%", "height": "10%"});
        this.createAndSetElement("text", menuOption,
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
        start = self.transformToSVGPoint(menuSVG, event);
      }
      function menuSliding(event) {
        if(sliding) {
          let now = self.transformToSVGPoint(menuSVG, event);
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
        start = self.transformToSVGPoint(self.scaledSVG, event);
      }
      function gridMoving(event) {
        if(moving) {
          let now = self.transformToSVGPoint(self.scaledSVG, event);
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
        const newPt = self.transformToSVGPoint(self.scaledSVG, event);
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
      program.points = program.createAndSetElement("g", program.scaledSVG, {"class": "points"});
      program.modes.push("ADD", "REMOVE");
    },

    preparation: function() {
      const self = this;

      this.staticSVG.addEventListener("mousedown", addPoints);
      this.staticSVG.addEventListener("mousedown", removePoints);

      function addPoints(event) {
        if(self.currentMode != "ADD") return null;
        //convert mouse coordinates to svg coordinates to nearest grid coordinate.
        let newPt = self.transformToSVGPoint(self.scaledSVG, event);
        let yLengths = self.intDivide(newPt.y, self.yLength);
        let xLengths = Math.floor(newPt.x / self.xLength - yLengths / 2);

        let circle = self.createAndSetElement("circle", self.points,
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
      this.createAndSetElement("circle", this.scaledSVG, {"class": "centerCircle", 'r': 2});
    }
  };

  //Fill global or exports depending on import method
  exports.moduleMenu = moduleMenu;
  exports.moduleMove = moduleMove;
  exports.moduleZoom = moduleZoom;
  exports.modulePoints = modulePoints;
  exports.moduleCenterMarker = moduleCenterMarker;
  exports.__esModule = true;
}));
