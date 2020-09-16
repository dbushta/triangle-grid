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

      program.menu.addEventListener("touchstart", menuSlideStart);
      program.menu.addEventListener("touchmove", menuSliding);
      program.menu.addEventListener("touchend", menuSlideEnd);
      program.menu.addEventListener("touchcancel", menuSlideEnd);

      let sliding = false;
      let start = null;

      function menuControl(event) {
        let parentGroup = event.target.parentElement;
        if(!parentGroup.classList.contains("menuOption")) return null;
        program.currentMode = parentGroup.childNodes[1].childNodes[0].nodeValue;
        menuButton.childNodes[1].childNodes[0].nodeValue = program.currentMode;
        for(const element of toggleable) {
          element.style.display = element.style.display == "none" ? "initial": "none";
        }
      }
      function menuSlideStart(event) {
        //Prevent mousedown events on other SVGs
        event.stopPropagation();
        if(program.currentMode != "MENU") return null;
        sliding = true;
        event = event.clientX ? event : event.touches[0];
        start = program.transformToSVGPoint(program.staticSVG, event);
        start.x *= menuViewBox.width / program.maxZoom.width;
        start.y *= menuViewBox.height / program.maxZoom.height;
        start.x += menuViewBox.x;
        start.y += menuViewBox.y;
      }
      function menuSliding(event) {
        if(sliding) {
          event = event.clientX ? event : event.touches[0];
          let now = program.transformToSVGPoint(program.staticSVG, event);
          now.x *= menuViewBox.width / program.maxZoom.width;
          now.y *= menuViewBox.height / program.maxZoom.height;
          now.x += menuViewBox.x;
          now.y += menuViewBox.y;
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
    },

    preparation: function(program) {
      program.staticSVG.addEventListener("mousedown", gridMoveStart);
      program.staticSVG.addEventListener("mousemove", gridMoving);
      program.staticSVG.addEventListener("mouseup", gridMoveEnd);
      program.staticSVG.addEventListener("mouseleave", gridMoveEnd);

      program.staticSVG.addEventListener("touchstart", gridMoveStart);
      program.staticSVG.addEventListener("touchmove", gridMoving);
      program.staticSVG.addEventListener("touchend", gridMoveEnd);
      program.staticSVG.addEventListener("touchcancel", gridMoveEnd);

      //Use closure to hold variables between eventListeners
      let moving = false;
      let start = null;

      function gridMoveStart(event) {
        if(program.currentMode != "MOVE") return null;
        //Prevent accidental highlighting
        event.preventDefault();
        moving = true;
        event = event.clientX ? event : event.touches[0];
        start = program.transformToSVGPoint(program.staticSVG, event);
        start.x *= program.viewBox.width / program.maxZoom.width;
        start.y *= program.viewBox.height / program.maxZoom.height;
        start.x += program.viewBox.x;
        start.y += program.viewBox.y;
      }
      function gridMoving(event) {
        if(moving) {
          event = event.clientX ? event : event.touches[0];
          let now = program.transformToSVGPoint(program.staticSVG, event);
          now.x *= program.viewBox.width / program.maxZoom.width;
          now.y *= program.viewBox.height / program.maxZoom.height;
          now.x += program.viewBox.x;
          now.y += program.viewBox.y;
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
    },

    preparation: function(program) {
      program.staticSVG.addEventListener("mousedown", gridZoomStart);
      program.staticSVG.addEventListener("mousemove", gridZooming);
      program.staticSVG.addEventListener("mouseup", gridZoomEnd);
      program.staticSVG.addEventListener("mouseleave", gridZoomEnd);

      program.staticSVG.addEventListener("touchstart", gridZoomStart);
      program.staticSVG.addEventListener("touchmove", gridZooming);
      program.staticSVG.addEventListener("touchend", gridZoomEnd);
      program.staticSVG.addEventListener("touchcancel", gridZoomEnd);

      let zooming = false;
      let start = 0;

      //get distance from current screen center.
      function getDistanceFromSVGCenter(event) {
        const newPt = program.transformToSVGPoint(program.staticSVG, event);
        newPt.x *= program.viewBox.width / program.maxZoom.width;
        newPt.y *= program.viewBox.height / program.maxZoom.height;
        newPt.x += program.viewBox.x;
        newPt.y += program.viewBox.y;
        return Math.hypot(newPt.x - (program.viewBox.x + program.viewBox.width / 2),
          newPt.y - (program.viewBox.y + program.viewBox.height / 2));
      }
      function gridZoomStart(event) {
        if(program.currentMode != "ZOOM") return null;
        //Prevent accidental highlighting
        event.preventDefault();
        zooming = true;
        event = event.clientX ? event : event.touches[0];
        start = getDistanceFromSVGCenter(event);
      }
      function gridZooming(event) {
        if(zooming) {
          event = event.clientX ? event : event.touches[0];
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
      program.points = program.createAndSetElement("g", program.scaledSVG, {"class": "points"});
      program.modes.push("ADD", "REMOVE");
      program.currentMode = "ADD";
    },

    preparation: function(program) {
      program.staticSVG.addEventListener("mousedown", addPoints);
      program.staticSVG.addEventListener("mousedown", removePoints);
      program.staticSVG.addEventListener("touchstart", addPoints);
      program.staticSVG.addEventListener("touchstart", removePoints);

      function addPoints(event) {
        if(program.currentMode != "ADD") return null;
        //convert mouse coordinates to svg coordinates to nearest grid coordinate.
        event = event.clientX ? event : event.touches[0];
        const sVGPoint = program.transformToSVGPoint(program.staticSVG, event);
        sVGPoint.x *= program.viewBox.width / program.maxZoom.width;
        sVGPoint.y *= program.viewBox.height / program.maxZoom.height;
        sVGPoint.x += program.viewBox.x;
        sVGPoint.y += program.viewBox.y;
        const gridPoint = program.nearestGridPoint(sVGPoint);
        const roundedSVGPoint = program.gridToSVGPoint(gridPoint);

        let circle = program.createAndSetElement("circle", program.points, {'r': '2',
          "cx": roundedSVGPoint.x, "cy": roundedSVGPoint.y, "class": "point"});
        circle.style.fill = "white";
        circle.style.stroke = "black";
        circle.style.strokeWidth = 1;
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
