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
      program.currentZoom = 0.5;
      program.modes.push("ZOOM");
      program.modeMenus["ZOOM"] = program.createAndSetElement("g", program.staticSVG, {id: "zoomMenu"});
      program.createAndSetElement("circle", program.modeMenus["ZOOM"],
        {id: "zoomCircle", r: 1, cx: program.maxZoom.width / 2, cy: program.maxZoom.height / 2,
        style: "fill: none; stroke: red; stroke-width: 2"});
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
      const zoomCircle = program.modeMenus["ZOOM"].getElementsByTagName("circle")[0];

      //Zoom in halfway, so user can zoom in or out at start.
      program.viewBox.x += program.maxZoom.width / 4;
      program.viewBox.y += program.maxZoom.height / 4;
      program.viewBox.width -= program.maxZoom.width / 2;
      program.viewBox.height -= program.maxZoom.height / 2;

      //get distance from current screen center.
      function getDistanceFromScaledSVGCenter(event) {
      const newPt = program.transformToSVGPoint(program.scaledSVG, event);
      return Math.hypot(newPt.x - (program.viewBox.x + program.viewBox.width / 2),
        newPt.y - (program.viewBox.y + program.viewBox.height / 2));
    }

      //get distance from current screen center.
      function getDistanceFromStaticSVGCenter(event) {
        const newPt = program.transformToSVGPoint(program.staticSVG, event);
        return Math.hypot(newPt.x - program.maxZoom.width / 2,
          newPt.y - program.maxZoom.height / 2);
      }
      function gridZoomStart(event) {
        if(program.currentMode != "ZOOM") return null;
        //Prevent accidental highlighting
        event.preventDefault();
        zooming = true;
        event = event.type == "mousedown" ? event : event.touches[0];
        start = getDistanceFromScaledSVGCenter(event);
        zoomCircle.setAttributeNS(null, 'r', getDistanceFromStaticSVGCenter(event));
      }
      function gridZooming(event) {
        if(zooming) {
          event = event.type == "mousemove" ? event : event.touches[0];
          let now = getDistanceFromScaledSVGCenter(event);
          let hypotRatio = (now - start) / program.maxZoom.hypotenuse;
          //Retain zoom bounds
          let circleColor = "red";
          if(program.currentZoom - hypotRatio > 1) {
            hypotRatio = program.currentZoom - 1;
          } else if(program.currentZoom - hypotRatio < .05) {
            hypotRatio = program.currentZoom - .05;
          } else {
            zoomCircle.setAttributeNS(null, 'r', getDistanceFromStaticSVGCenter(event));
            circleColor = "black"
          }
          zoomCircle.style.stroke = circleColor;
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

  //Fill global or exports depending on import method
  exports.moduleAroundCenterZoom = moduleAroundCenterZoom;
  exports.__esModule = true;
}));
