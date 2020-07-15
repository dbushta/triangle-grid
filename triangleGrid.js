(function(global, factory) {
  global = global || self;
  factory(global.triGrid = global.triGrid || {});
}(this, function(exports) {
  "use strict"
  class triangleGrid {
    constructor(svg, sideLength) {
      this.svg = svg;
    }
  }
  exports.triangleGrid = triangleGrid;
}));
