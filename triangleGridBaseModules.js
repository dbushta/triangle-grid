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
      const menuGroup = program.createAndSetElement("g", program.staticSVG, {id: "menuGroup"});
      program.modeMenus["MENU"] = program.createAndSetElement("g", menuGroup, {id: "menuMenu"});
      program.currentMode = "MENU";
    }

    preparation() {
      const program = this.program;
      let entireGroup = program.staticSVG.getElementById("menuGroup");
      //Retain this list to hide and show the menu
      let menuBackground = program.createAndSetElement("rect", program.modeMenus["MENU"],
        {class: "menuBackground", x: "25%", width: "50%", height: "100%", style: "fill: #ffffffa0"});

      //create svg to store all to be made mode buttons
      let buttonGroup = program.createAndSetElement("g", program.modeMenus["MENU"],
        {class: "menuButtons", transform: `translate(${program.maxZoom.width * .25}, 0)`});

      //create open menu button
      const menuButton = program.createAndSetElement("g", entireGroup,
        {class: "menuButton menuOption", "data-mode": "MENU", style: "display: none",
        transform: `translate(${program.maxZoom.width * .375}, ${program.maxZoom.height * .9})`});
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
        //Hide associated mode menu
        if(program.modeMenus[program.modes[i]]) program.modeMenus[program.modes[i]].style.display = "none";
        //Create menu buttons for each mode
        const menuOption = program.createAndSetElement("g", buttonGroup, {
          "data-mode": program.modes[i], "class" :"menuOption", "transform": `translate(
          ${program.maxZoom.width * .125}, ${program.maxZoom.height * (1 + i) * .15})`});
        let optionRect = program.createAndSetElement("rect", menuOption,
          {class: "menuBackground", width: "25%", height: "10%", style: "fill: #ffffffa0"});
        let optionText = program.createAndSetElement("text", menuOption,
          {class: "menuButtonText", x: "12.5%", y: "5%"});
        optionText.appendChild(document.createTextNode(program.modes[i]));
        optionText.style.dominantBaseline= "middle";
        optionText.style.textAnchor = "middle";
      }

      const maxScroll = -program.maxZoom.height * (program.modes.length - 6) * .15;

      entireGroup.addEventListener("mousedown", menuControl);

      if(program.modes.length < 7) return null;

      program.addEventListeners(entireGroup,
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
            `translate(${program.maxZoom.width * .25}, ${currentSlide})`);
          start = now;
          //menuViewBox.y = change;
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

    preparation() {
      const program = this.program;
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
          program.viewBox.x -= (now.x - start.x);
          program.viewBox.y -= (now.y - start.y);
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
      //0.05 to 1 maxZoom
      program.currentZoom = 0.5;
      program.modes.push("ZOOM");
      program.modeMenus["ZOOM"] = program.createAndSetElement(
        "g", program.staticSVG, {id: "zoomMenu"}
      );
    }

    preparation() {
      const program = this.program;
      program.addEventListeners(program.staticSVG,
        [{type: "mousedown", handler: gridZoomStart}, {type: "mousemove", handler: gridZooming},
        {type: "mouseup", handler: gridZoomEnd}, {type: "mouseleave", handler: gridZoomEnd},
        {type: "touchstart", handler: gridZoomStart}, {type: "touchmove", handler: gridZooming},
        {type: "touchend", handler: gridZoomEnd}, {type: "touchcancel", handler: gridZoomEnd}]);

      let zooming = false;
      let start = 0;

      //Zoom in halfway, so user can zoom in or out at start.
      program.viewBox.x += program.maxZoom.width / 4;
      program.viewBox.y += program.maxZoom.height / 4;
      program.viewBox.width -= program.maxZoom.width / 2;
      program.viewBox.height -= program.maxZoom.height / 2;

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
          let hypotRatio = (now.y - start.y) / program.maxZoom.height;
          start = now;
          //Retain zoom bounds
          if(program.currentZoom - hypotRatio > 1) {
            hypotRatio = program.currentZoom - 1;
          } else if(program.currentZoom - hypotRatio < .05) {
            hypotRatio = program.currentZoom - .05;
          }
          program.currentZoom -= hypotRatio;
          //Make sure to move viewBox while scaling to keep centered
          program.viewBox.x += program.maxZoom.width * hypotRatio / 2;
          program.viewBox.y += program.maxZoom.height * hypotRatio / 2;
          program.viewBox.width -= program.maxZoom.width * hypotRatio;
          program.viewBox.height -= program.maxZoom.height * hypotRatio;
          program.updateSVG();
        }
      }
      function gridZoomEnd(event) {
        zooming = false;
        program.modeMenus["ZOOM"]
      }
    }
  }


  /*Method modulePoints
   *Parameters: null
   *Description: install setPoints
   *Return: null
   */
  class modulePoints {
    constructor(program) {
      this.program = program;
      program.points = program.createAndSetElement("g", program.scaledSVG, {"class": "pointGroup"});
      program.modes.push("ADD", "REMOVE");
      program.modeMenus["ADD"] = null;
      program.modeMenus["REMOVE"] = null;
    }

    preparation() {
      const program = this.program;
      program.addEventListeners(program.staticSVG, [
        {type: "mousedown", handler: addPoints}, {type: "mousedown", handler: removePoints},
        {type: "touchstart", handler: addPoints}, {type: "touchstart", handler: removePoints}]);

      function addPoints(event) {
        if(program.currentMode != "ADD") return null;
        event = event.type == "mousedown" ? event : event.touches[0];
        //convert mouse coordinates to svg coordinates to nearest grid coordinate.
        const sVGPoint = program.transformToSVGPoint(program.scaledSVG, event);
        const gridPoint = program.nearestGridPoint(sVGPoint);
        const roundedSVGPoint = program.gridToSVGPoint(gridPoint);

        let circle = program.createAndSetElement("circle", program.points,
          {r: '2', cx: roundedSVGPoint.x, cy: roundedSVGPoint.y, class: "point",
          style: "fill: white; stroke: black; stroke-width: 1"});
      }
      function removePoints(event) {
        if(program.currentMode != "REMOVE") return null;
        if(event.target.classList.contains("point")) event.target.remove();
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
  exports.modulePoints = modulePoints;
  exports.moduleCenterMarker = moduleCenterMarker;
  exports.__esModule = true;
}));
