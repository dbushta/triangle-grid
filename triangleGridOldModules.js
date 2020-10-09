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
        [{type: "mousedown", handler: gridZoomStart}, {type: "mousemove", handler: gridZooming},
        {type: "mouseup", handler: gridZoomEnd}, {type: "mouseleave", handler: gridZoomEnd},
        {type: "touchstart", handler: gridZoomStart}, {type: "touchmove", handler: gridZooming},
        {type: "touchend", handler: gridZoomEnd}, {type: "touchcancel", handler: gridZoomEnd}]);

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
