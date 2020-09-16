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

    preparation: function(program) {
      //Retain this list to hide and show the menu
      let toggleable = [program.createAndSetElement("rect", program.menu,
        {"class": "menuBackground hideElement", "width": "50%", "height": "100%"})];
      toggleable[0].style.fill = "#f0f8ffa0";
      toggleable[0].style.display = "initial";
      //create svg to store all to be made mode buttons
      let menuSVG = program.createAndSetElement("svg", program.menu,
        {"class": "menu", "width": "50%", "viewBox": `0 0 ${program.maxZoom.width * .5}
        ${program.maxZoom.height * .9}`, "class": "menuOption"});
      let menuViewBox = menuSVG.viewBox.baseVal;
      //create open menu button
      const menuButton = program.createAndSetElement("g", program.menu, {"class": "menuOption",
        "transform": `translate(${program.maxZoom.width * .125}, ${program.maxZoom.height * .9})`});
      menuButton.style.display = "none";
      toggleable.push(menuButton);
      let menuRect = program.createAndSetElement("rect", menuButton, {"data-mode": "MENU",
        "class": "menuBackground menuButtonHover", "width": "25%", "height": "10%"});
      menuRect.style.fill = "#f0f8ffa0";
      let menuText = program.createAndSetElement("text", menuButton,
        {"class": "menuButtonText", 'x': "12.5%", 'y': "5%"});
      menuText.appendChild(document.createTextNode(program.currentMode));
      menuText.style.fill = "#ffffff";
      menuText.style.dominantBaseline = "middle";
      menuText.style.textAnchor = "middle";
      //Create each mode button in menu
      for(let i = 0, iLen = program.modes.length; i < iLen; ++i) {
        const menuOption = program.createAndSetElement("g", menuSVG, {
          "class" :"menuOption", "transform": `translate(
          ${program.maxZoom.width * .125}, ${program.maxZoom.height * (1 + i) * .15})`});
        toggleable.push(menuOption);
        let optionRect = program.createAndSetElement("rect", menuOption, {
          "class": "menuBackground menuButtonHover", "width": "50%", "height": "10%"});
        optionRect.style.fill = "#f0f8ffa0";
        optionRect.style.display = "initial";
        let optionText = program.createAndSetElement("text", menuOption,
          {"class": "menuButtonText", 'x': "25%", 'y': "5%"});
        optionText.style.fill = "#ffffff";
        optionText.appendChild(document.createTextNode(program.modes[i]));
        optionText.style.dominantBaseline= "middle";
        optionText.style.textAnchor = "middle";
      }

      const maxScroll = program.maxZoom.height * (program.modes.length - 4) * .15;

      program.menu.addEventListener("click", menuControl);
      program.menu.addEventListener("mousedown", menuSlideStart);
      program.menu.addEventListener("mousemove", menuSliding);
      program.menu.addEventListener("mouseup", menuSlideEnd);
      program.menu.addEventListener("mouseleave", menuSlideEnd);

      const self = program;
      let sliding = false;
      let start = null;

      function menuControl(event) {
        let parentGroup = event.target.parentElement;
        if(!parentGroup.classList.contains("menuOption")) return null;
        console.log(parentGroup.childNodes[1].nodeValue);
        self.currentMode = parentGroup.childNodes[1].childNodes[0].nodeValue;
        menuButton.childNodes[1].childNodes[0].nodeValue = self.currentMode;
        for(const element of toggleable) {
          element.style.display = element.style.display == "none" ? "initial": "none";
        }
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

    preparation: function(program) {
      //Use closure to hold variables between eventListeners
      const self = program;
      let moving = false;
      let start = null;

      program.staticSVG.addEventListener("mousedown", gridMoveStart);
      program.staticSVG.addEventListener("mousemove", gridMoving);
      program.staticSVG.addEventListener("mouseup", gridMoveEnd);
      program.staticSVG.addEventListener("mouseleave", gridMoveEnd);

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

    preparation: function(program) {
      const self = program;
      let zooming = false;
      let start = 0;

      program.staticSVG.addEventListener("mousedown", gridZoomStart);
      program.staticSVG.addEventListener("mousemove", gridZooming);
      program.staticSVG.addEventListener("mouseup", gridZoomEnd);
      program.staticSVG.addEventListener("mouseleave", gridZoomEnd);

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

    preparation: function(program) {
      const self = program;

      program.staticSVG.addEventListener("mousedown", addPoints);
      program.staticSVG.addEventListener("mousedown", removePoints);

      function addPoints(event) {
        if(self.currentMode != "ADD") return null;
        //convert mouse coordinates to svg coordinates to nearest grid coordinate.
        let newPt = self.transformToSVGPoint(self.scaledSVG, event);
        let yLengths = self.intDivide(newPt.y, self.yLength);
        let xLengths = Math.floor(newPt.x / self.xLength - yLengths / 2);

        let circle = self.createAndSetElement("circle", self.points,
          {'r': '2', "cx": self.xLength * (xLengths + yLengths / 2),
          "cy": yLengths * self.yLength, "class": "point"});
        circle.style.fill = "white";
        circle.style.stroke = "black";
        circle.style.strokeWidth = 1;
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
    preparation: function(program) {
      let center = program.createAndSetElement("circle", program.scaledSVG,
        {"class": "centerCircle", 'r': 2});
      center.style.fill = "red";
      center.style.stroke = "black";
      center.style.strokeWidth = 1;
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
