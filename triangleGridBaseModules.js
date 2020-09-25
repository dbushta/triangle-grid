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
      program.modes.push("MENU");
      //Create an outside group, to separate the menuButton and Menu
      const menuGroup = program.createAndSetElement("g", program.staticSVG, {id: "menuGroup"});
      program.modeMenus["MENU"] = program.createAndSetElement("g", menuGroup, {
        id: "menuMenu", transform: `translate(${program.maxZoom.width * .25}, 0)`});
      program.currentMode = "MENU";
    },

    preparation: function(program) {
      let entireGroup = program.staticSVG.getElementById("menuGroup");
      //Retain this list to hide and show the menu
      let menuBackground = program.createAndSetElement("rect", program.modeMenus["MENU"],
        {class: "menuBackground hideElement", width: "50%", height: "100%", style: "fill: #f0f8ffa0"});

      //create svg to store all to be made mode buttons
      let menuSVG = program.createAndSetElement("svg", program.modeMenus["MENU"],
        {class: "menu", width: "50%", viewBox: `0 0 ${program.maxZoom.width * .5}
        ${program.maxZoom.height * .9}`, class: "menuOption"});
      let menuViewBox = menuSVG.viewBox.baseVal;

      //create open menu button
      const menuButton = program.createAndSetElement("g", entireGroup,
        {class: "menuButton menuOption", "data-mode": "MENU", style: "display: none",
        transform: `translate(${program.maxZoom.width * .375}, ${program.maxZoom.height * .9})`});
      let menuRect = program.createAndSetElement("rect", menuButton, {
        class: "menuBackground menuButtonHover",
        width: "25%", height: "10%", style: "fill: #f0f8ffa0"});
      let menuText = program.createAndSetElement("text", menuButton,
        {class: "menuButtonText", x: "12.5%", y: "5%", style: "fill: #ffffff"});
      menuText.appendChild(document.createTextNode(program.currentMode));
      menuText.style.dominantBaseline = "middle";
      menuText.style.textAnchor = "middle";

      //Create each mode button in menu
      for(let i = 0, iLen = program.modes.length; i < iLen; ++i) {
        //MENU is reserved to activating the menu
        if(program.modes[i] == "MENU") continue;
        const menuOption = program.createAndSetElement("g", menuSVG, {
          "data-mode": program.modes[i], "class" :"menuOption", "transform": `translate(
          ${program.maxZoom.width * .125}, ${program.maxZoom.height * (1 + i) * .15})`});
        let optionRect = program.createAndSetElement("rect", menuOption,
          {class: "menuBackground menuButtonHover", width: "50%", height: "10%"});
        optionRect.style.fill = "#f0f8ffa0";
        let optionText = program.createAndSetElement("text", menuOption,
          {class: "menuButtonText", x: "25%", y: "5%", style: "fill: #ffffff"});
        optionText.appendChild(document.createTextNode(program.modes[i]));
        optionText.style.dominantBaseline= "middle";
        optionText.style.textAnchor = "middle";
      }

      const maxScroll = program.maxZoom.height * (program.modes.length - 4) * .15;

      program.addEventListeners(entireGroup, [{type: "click", handler: menuControl},
        {type: "mousedown", handler: menuSlideStart}, {type: "mousemove", handler: menuSliding},
        {type: "mouseup", handler: menuSlideEnd}, {type: "mouseleave", handler: menuSlideEnd},
        {type: "touchstart", handler: menuSlideStart}, {type: "touchmove", handler: menuSliding},
        {type: "touchend", handler: menuSlideEnd}, {type: "touchcancel", handler: menuSlideEnd}]);

      let sliding = false;
      let start = null;

      function menuControl(event) {
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
          let change = menuViewBox.y - (now.y - start.y);
          //Make sure not to lose the mode buttons
          if(change < 0) change = 0;
          else if(change > maxScroll) change = maxScroll;
          menuViewBox.y = change;
          program.updateSVG();
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
      program.modeMenus["MOVE"] = null;
    },

    preparation: function(program) {
      program.addEventListeners(program.staticSVG, [
        {type: "mousedown", handler: gridMoveStart}, {type: "mousemove", handler: gridMoving},
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
      program.modeMenus["ZOOM"] = null;
    },

    preparation: function(program) {
      program.addEventListeners(program.staticSVG, [
        {type: "mousedown", handler: gridZoomStart}, {type: "mousemove", handler: gridZooming},
        {type: "mouseup", handler: gridZoomEnd}, {type: "mouseleave", handler: gridZoomEnd},
        {type: "touchstart", handler: gridZoomStart}, {type: "touchmove", handler: gridZooming},
        {type: "touchend", handler: gridZoomEnd}, {type: "touchcancel", handler: gridZoomEnd}]);

      let zooming = false;
      let start = 0;

      //get distance from current screen center.
      function getDistanceFromSVGCenter(event) {
        const newPt = program.transformToSVGPoint(program.scaledSVG, event);
        return Math.hypot(newPt.x - (program.viewBox.x + program.viewBox.width / 2),
          newPt.y - (program.viewBox.y + program.viewBox.height / 2));
      }
      function gridZoomStart(event) {
        if(program.currentMode != "ZOOM") return null;
        //Prevent accidental highlighting
        event.preventDefault();
        zooming = true;
        event = event.type == "mousedown" ? event : event.touches[0];
        start = getDistanceFromSVGCenter(event);
      }
      function gridZooming(event) {
        if(zooming) {
          event = event.type == "mousemove" ? event : event.touches[0];
          let now = getDistanceFromSVGCenter(event);
          let hypotRatio = (now - start) / program.maxZoom.hypotenuse;
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
      program.points = program.createAndSetElement("g", program.scaledSVG, {"class": "pointGroup"});
      program.modes.push("ADD", "REMOVE");
      program.modeMenus["ADD"] = null;
      program.modeMenus["REMOVE"] = null;
    },

    preparation: function(program) {
      program.addEventListeners(program.staticSVG, [
        {type: "mousedown", handler: addPoints}, {type: "mousedown", handler: removePoints},
        {type: "touchstart", handler: addPoints}, {type: "touchstart", handler: removePoints}]);

      function addPoints(event) {
        if(program.currentMode != "ADD") return null;
        //convert mouse coordinates to svg coordinates to nearest grid coordinate.
        event = event.type == "mousedown" ? event : event.touches[0];
        const sVGPoint = program.transformToSVGPoint(program.scaledSVG, event);
        const gridPoint = program.nearestGridPoint(sVGPoint);
        const roundedSVGPoint = program.gridToSVGPoint(gridPoint);

        let circle = program.createAndSetElement("circle", program.points, {r: '2',
          cx: roundedSVGPoint.x, cy: roundedSVGPoint.y, class: "point",
          style: "fill: white; stroke: black; strokeWidth: 1"});
        program.points.appendChild(circle);
      }
      function removePoints(event) {
        if(program.currentMode != "REMOVE") return null;
        if(event.target.classList.contains("point")) event.target.remove();
      }
    }
  };

  /*object moduleCenterMarker
   *Parameters: null
   *Description: Add a circle to 0, 0 on the grid
   *  in preparation so itrenders above other elements.
   *return null
   */
  const moduleCenterMarker = {
    preparation: function(program) {
      let center = program.createAndSetElement("circle", program.scaledSVG,
        {class: "centerCircle", r: 2});
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
