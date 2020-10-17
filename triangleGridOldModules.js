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


  /*class moduleAroundCenterZoom
   *Parameter: null
   *Description: install zoom mode
   *Return: null
   */
  class moduleAroundCenterZoom {
    constructor(program) {
      this.program = program;
      //.05 to 1 maxZoom
      program.modes.push("ZOOM");
      program.modeMenus["ZOOM"] = program.createAndSetElement("g", program.staticSVG, {id: "zoomMenu"});
      program.createAndSetElement("circle", program.modeMenus["ZOOM"],
        {id: "zoomCircle", r: 1, cx: program.transform.maxZoom.width / 2,
        cy: program.transform.maxZoom.height / 2, style: "fill: none; stroke: red; stroke-width: 2"});
    }

    preparation(program) {
      program.addEventListeners(program.staticSVG,
        [{type: "pointerdown", handler: gridZoomStart}, {type: "pointermove", handler: gridZooming},
        {type: "pointerup", handler: gridZoomEnd}, {type: "pointerleave", handler: gridZoomEnd}]);

      let zooming = false;
      let start = 0;
      const zoomCircle = program.modeMenus["ZOOM"].getElementsByTagName("circle")[0];

      //Zoom in halfway, so user can zoom in or out at start.
      program.transform.zoom = 0.5;

      //get distance from current screen center.
      function getDistanceFromScaledSVGCenter(event) {
      const newPt = program.transformToSVGPoint(program.scaledSVG, event);
      return Math.hypot(newPt.x - (program.transform._viewBox.x + program.transform._viewBox.width / 2),
        newPt.y - (program.transform._viewBox.y + program.transform._viewBox.height / 2));
      }

      //get distance from current screen center.
      function getDistanceFromStaticSVGCenter(event) {
        const newPt = program.transformToSVGPoint(program.staticSVG, event);
        return Math.hypot(newPt.x - program.transform.maxZoom.width / 2,
          newPt.y - program.transform.maxZoom.height / 2);
      }

      function gridZoomStart(event) {
        if(program.currentMode != "ZOOM") return null;
        zooming = true;
        start = getDistanceFromScaledSVGCenter(event);
        zoomCircle.setAttributeNS(null, 'r', getDistanceFromStaticSVGCenter(event));
      }

      function gridZooming(event) {
        if(program.currentMode != "ZOOM" || !zooming) return null;
        let now = getDistanceFromScaledSVGCenter(event);
        let hypotRatio = (now - start) / program.transform.maxZoom.hypotenuse;
        //Retain zoom bounds
        let circleColor = "red";
        if(program.transform.currentZoom - hypotRatio > 1) {
          hypotRatio = program.transform.currentZoom - 1;
        } else if(program.transform.currentZoom - hypotRatio < 0.05) {
          hypotRatio = program.transform.currentZoom - 0.05;
        } else {
          zoomCircle.setAttributeNS(null, 'r', getDistanceFromStaticSVGCenter(event));
          circleColor = "black"
        }
        zoomCircle.style.stroke = circleColor;
        program.transform.zoomBy(-hypotRatio);
        program.updateSVG();
      }

      function gridZoomEnd(event) {
        if(program.currentMode != "ZOOM" || !zooming) return null;
        zooming = false;
        program.modeMenus["ZOOM"]
      }
    }
  }


  /*Method moduleTwoModesPoints
   *Parameters: null
   *Description: install setPoints
   *Return: null
   */
  class moduleTwoModesPoints {
    constructor(program) {
      this.program = program;
      this.points = program.createAndSetElement("g", program.scaledSVG, {"class": "pointGroup"});
      program.modes.push("ADD", "REMOVE");
      program.modeMenus["ADD"] = null;
      program.modeMenus["REMOVE"] = null;
    }

    preparation(program) {
      const self = this;
      program.addEventListeners(program.staticSVG, [
        {type: "pointerdown", handler: addPoints}, {type: "pointerdown", handler: removePoints}]);

      function addPoints(event) {
        if(program.currentMode != "ADD") return null;
        //convert mouse coordinates to svg coordinates to nearest grid coordinate.
        const sVGPoint = program.transformToSVGPoint(program.scaledSVG, event);
        const gridPoint = program.nearestGridPoint(sVGPoint);
        const roundedSVGPoint = program.gridToSVGPoint(gridPoint);

        let circle = program.createAndSetElement("circle", self.points,
          {r: '2', cx: roundedSVGPoint.x, cy: roundedSVGPoint.y, class: "point",
          style: "fill: white; stroke: black; stroke-width: 1"});
      }

      function removePoints(event) {
        if(program.currentMode != "REMOVE") return null;
        if(event.target.classList.contains("point")) event.target.remove();
      }
    }
  }

  //Fill global or exports depending on import method
  exports.moduleAroundCenterZoom = moduleAroundCenterZoom;
  exports.moduleTwoModesPoints = moduleTwoModesPoints;
  exports.__esModule = true;
}));
