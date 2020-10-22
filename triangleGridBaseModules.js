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
      program.addMode("MENU");
      //Create an outside group, to separate the menuButton and Menu
      this.menuGroup = program.createAndSetElement("g", program.staticSVG, {id: "menuGroup"});
      this.menuMenu = program.applyModeMenu("MENU",
        program.createAndSetElement("g", this.menuGroup, {id: "menuMenu"}));
    }

    preparation(program) {
      //Retain this list to hide and show the menu
      let menuBackground = program.createAndSetElement("rect", this.menuMenu,
        {class: "menuBackground", x: "25%", width: "50%", height: "100%"});
      menuBackground.style.fill = "#ffffffa0";

      //create svg to store all to be made mode buttons
      let buttonGroup = program.createAndSetElement("g", this.menuMenu,
        {class: "menuButtons", transform: `translate(${program.transform.maxZoom.width * .25}, 0)`});

      //create open menu button
      const menuButton = program.createAndSetElement("g", this.menuGroup,
        {class: "menuButton menuOption", "data-mode": "MENU",
        transform: `translate(${program.transform.maxZoom.width * .375},
        ${program.transform.maxZoom.height * .9})`});
      menuButton.style.display = "none";
      let menuRect = program.createAndSetElement("rect", menuButton, {
        class: "menuBackground", width: "25%", height: "10%"});
      menuRect.style.fill = "#ffffffa0";
      let menuText = program.createAndSetTextElement(program.currentMode, menuButton,
        {class: "menuButtonText", x: "12.5%", y: "5%"});
      program.setStyle(menuText, {dominantBaseline:"middle", textAnchor:"middle"});

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
          {class: "menuBackground", width: "25%", height: "10%"});
        optionRect.style.fill = "#ffffffa0";
        let optionText = program.createAndSetTextElement(program.modes[i], menuOption,
          {class: "menuButtonText", x: "12.5%", y: "5%"});
        program.setStyle(optionText, {dominantBaseline:"middle", textAnchor:"middle"});
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

      //The menu can hold six modes at once, but past that needs the scroll.
      if(program.modes.length < 7) return null;

      program.addEventListeners(this.menuGroup,
        [{type: "pointerdown", handler: menuSlideStart}, {type: "pointermove", handler: menuSliding},
        {type: "pointerup", handler: menuSlideEnd}, {type: "pointerleave", handler: menuSlideEnd}]);

      let sliding = false;
      let start = null;
      let currentSlide = 0;

      function menuControl(event) {
        event.stopPropagation();
        let parentGroup = event.target.parentElement;
        if(!parentGroup.classList.contains("menuOption")) return null;
        //Hide previous mode.
        if(program.modeMenus[program.currentMode]) {
          program.modeMenus[program.currentMode].style.display = "none";
        }
        program.currentMode = parentGroup.dataset.mode;
        menuButton.childNodes[1].childNodes[0].nodeValue = program.currentMode;
        //Hide/unhide menu button depending on mode.
        menuButton.style.display = program.currentMode == "MENU" ? "none" : "block";
        //Unhide current mode.
        if(program.modeMenus[program.currentMode]) {
          program.modeMenus[program.currentMode].style.display = "block";
        }
      }

      function menuSlideStart(event) {
        //Prevent mousedown events on other SVGs
        if(program.currentMode != "MENU") return null;
        sliding = true;
        start = program.transformToSVGPoint(program.staticSVG, event);
      }

      function menuSliding(event) {
        if(program.currentMode != "MENU" || !sliding) return null;
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

      function menuSlideEnd(event) {
        if(program.currentMode != "MENU" || !sliding) return null;
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
      program.addMode("MOVE");
    }

    preparation(program) {
      program.addEventListeners(program.staticSVG,
        [{type: "pointerdown", handler: gridMoveStart}, {type: "pointermove", handler: gridMoving},
        {type: "pointerup", handler: gridMoveEnd}, {type: "pointerleave", handler: gridMoveEnd}]);

      //Use closure to hold variables between eventListeners
      let moving = false;
      let start = null;

      function gridMoveStart(event) {
        if(program.currentMode != "MOVE") return null;
        moving = true;
        start = program.transformToSVGPoint(program.scaledSVG, event);
      }

      function gridMoving(event) {
        if(program.currentMode != "MOVE" || !moving) return null;
        let now = program.transformToSVGPoint(program.scaledSVG, event);
        program.transform.moveBy({x: now.x - start.x, y: now.y - start.y});
        program.updateSVG();
      }

      function gridMoveEnd(event) {
        if(program.currentMode != "MOVE" || !moving) return null;
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
      program.addMode("ZOOM");
      this.zoomMenu = program.applyModeMenu("ZOOM", null);

      this.sliderBar = program.createAndSetElement("rect", this.zoomMenu,
        {x: "92.5%", y : "0", height: "100%", width: "5%"});
      this.sliderBar.style.fill = "#ffffffa0";
      this.slider = program.createAndSetElement("rect", this.zoomMenu,
        {x: "92.5%", y : "47.5%", height: "10%", width: "5%"});
      program.setStyle(this.slider, {fill:"#ffffffd0", stroke:"grey"});
      let plus = program.createAndSetTextElement('+', this.zoomMenu, {x: "95%", y: "5%"});
      program.setStyle(plus, {"font-size":20, dominantBaseline:"middle", textAnchor:"middle"});
      let minus = program.createAndSetTextElement('-', this.zoomMenu, {x: "95%", y: "95%"});
      program.setStyle(minus, {"font-size":30, dominantBaseline:"middle", textAnchor:"middle"});
    }

    preparation(program) {
      const self = this;
      program.addEventListeners(program.staticSVG,
        [{type: "pointerdown", handler: gridZoomStart}, {type: "pointermove", handler: gridZooming},
        {type: "pointerup", handler: gridZoomEnd}, {type: "pointerleave", handler: gridZoomEnd}]);

      let zooming = false;
      let start = 0;

      //Zoom in halfway, so user can zoom in or out at start.
      program.transform.zoom = 0.5;

      function gridZoomStart(event) {
        if(program.currentMode != "ZOOM") return null;
        zooming = true;
        start = program.transformToSVGPoint(program.staticSVG, event);
      }

      function gridZooming(event) {
        if(program.currentMode != "ZOOM" || !zooming) return null;
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

      function gridZoomEnd(event) {
        if(program.currentMode != "ZOOM" || !zooming) return null;
        zooming = false;
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
      this.points = program.staticSVG.querySelector(".pointGroup");
      //Make sure there actually was a pointGroup.
      if(!program.staticSVG.querySelector(".pointGroup")) {
        this.points = program.createAndSetElement("g", program.scaledSVG, {class: "pointGroup"});
      }
      this.pointPositions = {};
      program.addMode("POINTS");
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
          const newPoint = program.createAndSetElement("circle", self.points,
            {r: '2', cx: roundedSVGPoint.x, cy: roundedSVGPoint.y, class: "point"});
          self.pointPositions[gridPointKey] = newPoint;
          program.setStyle(newPoint, {fill:"white", stroke:"black", strokewidth:1});
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
      this.points = program.staticSVG.querySelector(".pointGroup");
      //Make sure there actually was a pointGroup
      if(!this.points) {
        this.points = program.createAndSetElement("g", program.scaledSVG, {class: "pointGroup"});
      }
      this.pointPositions = {};
      //Try not to create doubles of the POINTS mode
      program.addMode("POINTS");
      program.applyModeMenu("POINTS");
      this.targetLines = [];
      this.totalVisibleLines = 0;
      //Apparently there are ones that support up to 10 fingers now.
      this.maxFingers = 10;
      for(let i = 0; i < this.maxFingers; ++i) {
        this.targetLines.push(program.createAndSetElement("line", program.modeMenus["POINTS"]));
        program.setStyle(this.targetLines[i], {stroke:"red", strokewidth:1});
      }
      this.targetCircle = program.createAndSetElement("circle", program.modeMenus["POINTS"], {r:1.5});
      program.setStyle(this.targetCircle, {fill:"red", stroke:"darkred", strokewidth:0.5, display:"none"});
      this.targetPosition = {x:0, y:0};
    }

    preparation(program) {
      const self = this;
      program.addEventListeners(program.staticSVG, [
        {type:"touchstart", handler:touchStart}, {type:"touchmove", handler:touchMid},
        {type:"touchend", handler:touchEnd}, {type:"touchcencel", handler:touchEnd}]);
      let touchActive = false;
      //if total > maxFingers only maxFingers will be visible, if total = 0 none will be visible.
      //Note this is dependent on touch screen capabilities.
      function setLineVisibility(total) {
        self.targetCircle.style.display = total ? "block" : "none";
        self.totalVisibleLines = 0;
        for(let i = 0; i < total && i < self.maxFingers; ++i) {
          self.targetLines[i].style.display = "block";
          self.totalVisibleLines++;
        }
        for(let i = total; i < self.maxFingers; ++i) {
          self.targetLines[i].style.display = "none";
        }
      }

      function touchStart(event) {
        if(program.currentMode != "POINTS") return null;
        event.preventDefault();
        setLineVisibility(event.touches.length);
        touchActive = true;
        touchMid(event);
      }

      function touchMid(event) {
        if(program.currentMode != "POINTS" || !touchActive) return null;
        //Prevent mouse event from going off.
        event.preventDefault();
        const totalTouches = event.touches.length;
        if(totalTouches > self.totalVisibleLines) setLineVisibility(totalTouches);
        //create the average screen touch on viewport.
        let mean = {x: 0, y: 0};
        for(let i = 0; i < totalTouches && i < self.maxFingers; ++i) {
          mean.x += event.touches[i].clientX;
          mean.y += event.touches[i].clientY;
          //Set coordinates for the line ends at touches on static svg.
          let staticSVGPoint = program.transformToSVGPoint(program.staticSVG, event.touches[i]);
          program.setAttributesNS(self.targetLines[i], {x1: staticSVGPoint.x, y1: staticSVGPoint.y});
        }
        mean.x /= totalTouches;
        mean.y /= totalTouches;
        //set coordinates for the other line ends at mean touch
        const staticSVGPoint = program.transformToSVGPoint(program.staticSVG, mean);
        program.setAttributesNS(self.targetCircle, {cx: staticSVGPoint.x, cy: staticSVGPoint.y});
        for(let i = 0; i < totalTouches && i < self.maxFingers; ++i) {
          program.setAttributesNS(self.targetLines[i], {x2: staticSVGPoint.x, y2: staticSVGPoint.y});
        }
        //use the mean like a single touch event.
        const scaledSVGPoint = program.transformToSVGPoint(program.scaledSVG, mean);
        self.targetPosition = program.nearestGridPoint(scaledSVGPoint);
      }

      function touchEnd(event) {
        if(program.currentMode != "POINTS" || !touchActive) return null;
        event.preventDefault();
        touchActive = false;
        const gridPointKey = `${self.targetPosition.x},${self.targetPosition.y}`;
        if(self.pointPositions.hasOwnProperty(gridPointKey)) {
          //remove element and then delete key
          self.pointPositions[gridPointKey].remove();
          delete self.pointPositions[gridPointKey];
        } else {
          //get actual svg coordinates and create circle at them.
          const roundedSVGPoint = program.gridToSVGPoint(self.targetPosition);
          const newPoint = program.createAndSetElement("circle", self.points,
            {r: '2', cx: roundedSVGPoint.x, cy: roundedSVGPoint.y, class: "point"});
          self.pointPositions[gridPointKey] = newPoint;
          program.setStyle(newPoint, {fill:"white", stroke:"black", strokewidth:1});
        }
        //Hide all the lines, to let user know to restart.
        setLineVisibility(0);
      }
    }
  }


  /*object moduleCenterMarker
   *Parameters: null
   *Description: Add a circle to 0, 0 on the grid
   *  in preparation so it renders above other elements made in constructor.
   */
  class moduleCenterMarker {
    constructor(program) {}

    preparation(program) {
      let center = program.createAndSetElement("circle", program.scaledSVG, {class: "centerCircle", r: 1.5});
      program.setStyle(center, {fill:"red"})
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
