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

  /*class moduleMenu
   *Parameters: null
   *Description: install menu mode
   *Return: null
   */
  class moduleMenu {
    constructor(program) {
      this.program = program;
      program.modes.push("MENU");
      //Create an outside group, to separate the menuButton and Menu
      this.menuGroup = program.createAndSetElement("g", program.staticSVG, {id: "menuGroup"});
      program.modeMenus["MENU"] = program.createAndSetElement("g", this.menuGroup, {id: "menuMenu"});
    }

    preparation(program) {
      //Retain this list to hide and show the menu
      let menuBackground = program.createAndSetElement("rect", program.modeMenus["MENU"],
        {class: "menuBackground", x: "25%", width: "50%", height: "100%", style: "fill: #ffffffa0"});

      //create svg to store all to be made mode buttons
      let buttonGroup = program.createAndSetElement("g", program.modeMenus["MENU"],
        {class: "menuButtons", transform: `translate(${program.transform.maxZoom.width * .25}, 0)`});

      //create open menu button
      const menuButton = program.createAndSetElement("g", this.menuGroup,
        {class: "menuButton menuOption", "data-mode": "MENU", style: "display: none",
        transform: `translate(${program.transform.maxZoom.width * .375},
        ${program.transform.maxZoom.height * .9})`});
      let menuRect = program.createAndSetElement("rect", menuButton, {
        class: "menuBackground", width: "25%", height: "10%", style: "fill: #ffffffa0"});
      let menuText = program.createAndSetElement("text", menuButton,
        {class: "menuButtonText", x: "12.5%", y: "5%"});
      menuText.appendChild(document.createTextNode(program.currentMode));
      menuText.style.dominantBaseline = "middle";
      menuText.style.textAnchor = "middle";

      //Create each mode button in menu
      for(let i = 0, iLen = program.modes.length; i < iLen; ++i) {
        //MENU is reserved to activating the menu
        if(program.modes[i] == "MENU") continue;
        //Create menu buttons for each mode
        const menuOption = program.createAndSetElement("g", buttonGroup, {
          "data-mode": program.modes[i], "class" :"menuOption", "transform": `translate(
          ${program.transform.maxZoom.width * .125},
          ${program.transform.maxZoom.height * (1 + i) * .15})`});
        let optionRect = program.createAndSetElement("rect", menuOption,
          {class: "menuBackground", width: "25%", height: "10%", style: "fill: #ffffffa0"});
        let optionText = program.createAndSetElement("text", menuOption,
          {class: "menuButtonText", x: "12.5%", y: "5%"});
        optionText.appendChild(document.createTextNode(program.modes[i]));
        optionText.style.dominantBaseline = "middle";
        optionText.style.textAnchor = "middle";
      }

      //Hide all mode menus
      for(const mode of program.modes) {
        if(program.modeMenus[mode]) program.modeMenus[mode].style.display = "none";
      }

      //Unhide current mode.
      if(program.modeMenus[program.currentMode]) {
        program.modeMenus[program.currentMode].style.display = "block";
        if(program.currentMode != "MENU") {
          menuButton.style.display = "block";
        }
      }

      const maxScroll = -program.transform.maxZoom.height * (program.modes.length - 6) * .15;

      this.menuGroup.addEventListener("mousedown", menuControl);

      if(program.modes.length < 7) return null;

      program.addEventListeners(this.menuGroup,
        [{type: "mousedown", handler: menuSlideStart}, {type: "mousemove", handler: menuSliding},
        {type: "mouseup", handler: menuSlideEnd}, {type: "mouseleave", handler: menuSlideEnd},
        {type: "touchstart", handler: menuSlideStart}, {type: "touchmove", handler: menuSliding},
        {type: "touchend", handler: menuSlideEnd}, {type: "touchcancel", handler: menuSlideEnd}]);

      let sliding = false;
      let start = null;
      let currentSlide = 0;

      function menuControl(event) {
        event.stopPropagation();
        let parentGroup = event.target.parentElement;
        if(!parentGroup.classList.contains("menuOption")) return null;
        if(program.modeMenus[program.currentMode]) {
          program.modeMenus[program.currentMode].style.display = "none";
        }
        program.currentMode = parentGroup.dataset.mode;
        menuButton.childNodes[1].childNodes[0].nodeValue = program.currentMode;
        menuButton.style.display = program.currentMode == "MENU" ? "none" : "block";
        if(program.modeMenus[program.currentMode]) {
          program.modeMenus[program.currentMode].style.display = "block";
        }
      }
      function menuSlideStart(event) {
        //Prevent mousedown events on other SVGs
        event.stopPropagation();
        if(program.currentMode != "MENU") return null;
        sliding = true;
        event = event.type == "mousedown" ? event : event.touches[0];
        start = program.transformToSVGPoint(program.staticSVG, event);
      }
      function menuSliding(event) {
        if(sliding) {
          event = event.type == "mousemove" ? event : event.touches[0];
          let now = program.transformToSVGPoint(program.staticSVG, event);
          currentSlide += (now.y - start.y);
          //Make sure not to lose the mode buttons
          if(currentSlide > 0) currentSlide = 0;
          else if(currentSlide < maxScroll) currentSlide = maxScroll;

          buttonGroup.setAttributeNS(null, "transform",
            `translate(${program.transform.maxZoom.width * .25}, ${currentSlide})`);
          start = now;
          program.updateSVG();
        }
      }
      function menuSlideEnd(event) {
        sliding = false;
      }
    }
  }


  /*class moduleMove
   *Parameters: null
   *Description: install move mode
   *Return: null
   */
  class moduleMove {
    constructor(program) {
      this.program = program;
      program.modes.push("MOVE");
      program.modeMenus["MOVE"] = null;
    }

    preparation(program) {
      program.addEventListeners(program.staticSVG,
        [{type: "mousedown", handler: gridMoveStart}, {type: "mousemove", handler: gridMoving},
        {type: "mouseup", handler: gridMoveEnd}, {type: "mouseleave", handler: gridMoveEnd},
        {type: "touchstart", handler: gridMoveStart},{type: "touchmove", handler: gridMoving},
        {type: "touchend", handler: gridMoveEnd}, {type: "touchcancel", handler: gridMoveEnd}]);

      //Use closure to hold variables between eventListeners
      let moving = false;
      let start = null;

      function gridMoveStart(event) {
        if(program.currentMode != "MOVE") return null;
        //Prevent accidental highlighting
        event.preventDefault();
        moving = true;
        event = event.type == "mousedown" ? event : event.touches[0];
        start = program.transformToSVGPoint(program.scaledSVG, event);
      }
      function gridMoving(event) {
        if(moving) {
          event = event.type == "mousemove" ? event : event.touches[0];
          let now = program.transformToSVGPoint(program.scaledSVG, event);
          program.transform.moveBy({x: now.x - start.x, y: now.y - start.y});
          program.updateSVG();
        }
      }
      function gridMoveEnd(event) {
        moving = false;
      }
    }
  }


  /*class moduleVerticalZoom
   *Parameter: null
   *Description: install zoom mode
   *Return: null
   */
  class moduleVerticalZoom {
    constructor(program) {
      this.program = program;
      program.modes.push("ZOOM");
      program.modeMenus["ZOOM"] = program.createAndSetElement("g", program.staticSVG, {id: "zoomMenu"});

      program.createAndSetElement("rect", program.modeMenus["ZOOM"],
        {x: "92.5%", y : "0", height: "100%", width: "5%", style: "fill: #ffffffa0;"});
      this.slider = program.createAndSetElement("rect", program.modeMenus["ZOOM"],
        {x: "92.5%", y : "47.5%", height: "10%", width: "5%",
        style: "fill: #ffffffd0; stroke: grey;"});
      let plus = program.createAndSetElement("text", program.modeMenus["ZOOM"],
        {x: "95%", y: "5%", style: "font-size: 30;"});
      plus.appendChild(document.createTextNode('+'));
      plus.style.dominantBaseline = "middle";
      plus.style.textAnchor = "middle";
      let minus = program.createAndSetElement("text", program.modeMenus["ZOOM"],
        {x: "95%", y: "95%", style: "font-size: 40;"});
      minus.appendChild(document.createTextNode('-'));
      minus.style.dominantBaseline = "middle";
      minus.style.textAnchor = "middle";
    }

    preparation(program) {
      const self = this;
      program.addEventListeners(program.staticSVG,
        [{type: "mousedown", handler: gridZoomStart}, {type: "mousemove", handler: gridZooming},
        {type: "mouseup", handler: gridZoomEnd}, {type: "mouseleave", handler: gridZoomEnd},
        {type: "touchstart", handler: gridZoomStart}, {type: "touchmove", handler: gridZooming},
        {type: "touchend", handler: gridZoomEnd}, {type: "touchcancel", handler: gridZoomEnd}]);

      let zooming = false;
      let start = 0;

      //Zoom in halfway, so user can zoom in or out at start.
      program.transform.zoom = 0.5;

      function gridZoomStart(event) {
        if(program.currentMode != "ZOOM") return null;
        //Prevent accidental highlighting
        event.preventDefault();
        zooming = true;
        event = event.type == "mousedown" ? event : event.touches[0];
        start = program.transformToSVGPoint(program.staticSVG, event);
      }
      function gridZooming(event) {
        if(zooming) {
          event = event.type == "mousemove" ? event : event.touches[0];
          const now = program.transformToSVGPoint(program.staticSVG, event);
          let hypotRatio = (now.y - start.y) / program.transform.maxZoom.height;
          start = now;
          let sliderColor = "red";
          //Retain zoom bounds
          if(program.transform.currentZoom + hypotRatio > 1) {
            hypotRatio = 1 - program.transform.currentZoom;
          } else if(program.transform.currentZoom + hypotRatio < 0.05) {
            hypotRatio = 0.05 - program.transform.currentZoom ;
          } else {
            sliderColor = "white";
          }
          program.transform.zoomBy(hypotRatio);
          self.slider.setAttributeNS(null, "y",
            `${program.transform.currentZoom * 95 - 5}%`);
          self.slider.style.fill = sliderColor;
          program.updateSVG();
        }
      }
      function gridZoomEnd(event) {
        zooming = false;
        program.modeMenus["ZOOM"]
      }
    }
  }


  /*Method moduleMousePoints
   *Parameters: null
   *Description: install setPoints
   *Return: null
   */
  class moduleMousePoints {
    constructor(program) {
      this.program = program;
      this.points = program.createAndSetElement("g", program.scaledSVG, {class: "pointGroup"});
      this.pointPositions = {};
      program.modes.push("POINTS");
      program.modeMenus["POINTS"] = null;
    }

    preparation(program) {
      const self = this;
      program.staticSVG.addEventListener("mousedown", addPoints);

      function addPoints(event) {
        if(program.currentMode != "POINTS") return null;
        //convert mouse coordinates to svg coordinates to nearest grid coordinate.
        const sVGPoint = program.transformToSVGPoint(program.scaledSVG, event);
        const gridPoint = program.nearestGridPoint(sVGPoint);
        const gridPointKey = `${gridPoint.x},${gridPoint.y}`;
        if(self.pointPositions.hasOwnProperty(gridPointKey)) {
          //remove element and then delete key
          self.pointPositions[gridPointKey].remove();
          delete self.pointPositions[gridPointKey];
        } else {
          //get actual svg coordinates and create circle at them.
          const roundedSVGPoint = program.gridToSVGPoint(gridPoint);
          self.pointPositions[gridPointKey] = program.createAndSetElement("circle", self.points,
            {r: '2', cx: roundedSVGPoint.x, cy: roundedSVGPoint.y, class: "point",
            style: "fill: white; stroke: black; stroke-width: 1"});;
        }
      }
    }
  }

  /*Method moduleTouchPoints
   *Parameters: null
   *Description: install setPoints
   *Return: null
   */
  class moduleTouchPoints {
    constructor(program) {
      this.program = program;
      //Check to see if another already exists, and grab it.
      this.points = program.createAndSetElement("g", program.scaledSVG, {class: "pointGroup"});
      this.pointPositions = {};
      program.modes.push("POINTS");
      program.modeMenus["POINTS"] = program.createAndSetElement("g", program.staticSVG, {id: "pointsMenu"});
      this.targetLines = [];
      for(let i = 0; i < 5; ++i) {
        this.targetLines.push(program.createAndSetElement("line", program.modeMenus["POINTS"],
          {style: "stroke: red; stroke-width: 1;"}));
      }
      this.target = this.program.createAndSetElement("circle", program.modeMenus["POINTS"],
        {r: 1, style: "fill: red; stroke: white; stroke-width: 1;"});
      this.targetPosition = {x: 0, y: 0};
    }

    preparation(program) {
      const self = this;
      program.staticSVG.addEventListener("touchstart", touchStart);
      program.staticSVG.addEventListener("touchmove", touchMid);
      program.staticSVG.addEventListener("touchend", touchEnd);
      program.staticSVG.addEventListener("touchcancel", touchEnd);

      let touchActive = false;
      function touchStart(event) {
        console.log("start touch");
        if(program.currentMode != "POINTS") return null;
        //Don't allow more than the average five fingers on screen.
        for(let i = 0, iMax = event.touches.length; i < iMax && i < 5; ++i) {
          self.targetLines[i].style.display = "block";
        }
        if(event.touches.length) touchActive = true;
      }
      function touchMid(event) {
        console.log("mid touch");
        if(!totalActive) return null;
        //create the average screen touch on viewport.
        let mean = {x: 0, y: 0};
        for(let i = 0, iMax = event.touches.length; i < iMax && i < 5; ++i) {
          mean.x += event.touches[i].clientX;
          mean.y += event.touches[i].clientY;
          //Set coordinates for the line ends at touches on static svg.
          let staticSVGPoint = program.transformToSVGPoint(program.staticSVG, event.touches[i]);
          program.setAttributesNS(self.targetLines[i], {x1: staticSVGPoint.x, y1: staticSVGPoint.y});
        }
        mean.x /= event.touches.length;
        mean.y /= event.touches.length;
        //set coordinates for the other line ends at mean touch
        for(let i = 0, iMax = event.touches.length; i < iMax && i < 5; ++i) {
          let staticSVGPoint = program.transformToSVGPoint(program.staticSVG, mean);
          program.setAttributesNS(self.targetLines[i], {x2: staticSVGPoint.x, y2: staticSVGPoint.y});
        }
        //use the mean like a single touch event.
        const staticSVGPoint = program.transformToSVGPoint(program.scaledSVG, mean);
        self.targetPosition = program.nearestGridPoint(staticSVGPoint);
      }
      function touchEnd(event) {
        console.log("end touch");
        if(!touchActive) return null;
        touchActive = false;
        const gridPointKey = `${self.targetPosition.x},${self.targetPosition.y}`;
        if(self.pointPositions.hasOwnProperty(gridPointKey)) {
          //remove element and then delete key
          self.pointPositions[gridPointKey].remove();
          delete self.pointPositions[gridPointKey];
        } else {
          //get actual svg coordinates and create circle at them.
          const roundedSVGPoint = program.gridToSVGPoint(self.targetPosition);
          self.pointPositions[gridPointKey] = program.createAndSetElement("circle", self.points,
            {r: '2', cx: roundedSVGPoint.x, cy: roundedSVGPoint.y, class: "point",
            style: "fill: white; stroke: black; stroke-width: 1"});;
        }
        //Hide all the lines, to let user know to restart.
        for(const targetLine of self.targetLines) {
          targetLine.style.display = "none";
        }
      }
    }
  }

  /*object moduleCenterMarker
   *Parameters: null
   *Description: Add a circle to 0, 0 on the grid
   *  in preparation so it renders above other elements.
   *return null
   */
  class moduleCenterMarker {
    constructor(program) {
      this.program = program;
    }
    preparation() {
      let center = this.program.createAndSetElement("circle", this.program.scaledSVG,
        {class: "centerCircle", r: 2, style: "fill: red; stroke: black; stroke-width: 1;"});
    }
  }

  //Fill global or exports depending on import method
  exports.moduleMenu = moduleMenu;
  exports.moduleMove = moduleMove;
  exports.moduleVerticalZoom = moduleVerticalZoom;
  exports.moduleMousePoints = moduleMousePoints;
  exports.moduleTouchPoints = moduleTouchPoints;
  exports.moduleCenterMarker = moduleCenterMarker;
  exports.__esModule = true;
}));
