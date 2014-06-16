/* @requires mapshaper-shape-utils, mapshaper-shape-geom */

MapShaper.PathIndex = PathIndex;

function PathIndex(shapes, arcs) {
  var _index;
  init(shapes);

  function init(shapes) {
    var boxes = [];

    shapes.forEach(function(shp) {
      if (shp) {
        MapShaper.forEachPath(shp, addPath);
      }
    });

    _index = require('rbush')();
    _index.load(boxes);

    function addPath(ids) {
      var bounds = arcs.getSimpleShapeBounds(ids);
      var bbox = bounds.toArray();
      bbox.ids = ids;
      bbox.bounds = bounds;
      boxes.push(bbox);
    }
  }

  // test if path is contained within an indexed path
  // assumes paths don't intersect (intersections should have been handled previously)
  this.pathIsEnclosed = function(pathIds) {
    var pathBounds = arcs.getSimpleShapeBounds(pathIds),
        cands = _index.search(pathBounds.toArray()),
        count = 0;

    cands.forEach(function(cand) {
      if (pathContainsPath(cand.ids, cand.bounds, pathIds, pathBounds)) count++;
    });
    return count % 2 == 1;
  };

  // return array of paths that are contained within a path, or null if none
  // @pathIds Array of arc ids comprising a closed path
  this.findEnclosedPaths = function(pathIds) {
    var pathBounds = arcs.getSimpleShapeBounds(pathIds),
        cands = _index.search(pathBounds.toArray()),
        paths = [];

    cands.forEach(function(cand) {
      if (pathContainsPath(pathIds, pathBounds, cand.ids, cand.bounds)) paths.push(cand.ids);
    });
    return paths.length > 0 ? paths : null;
  };

  // assume polygon paths do not intersect (may be adjacent)
  function pathContainsPath(idsA, boundsA, idsB, boundsB) {
    if (boundsA.contains(boundsB) === false) return false;

    // A contains B iff some point on B is inside A
    // TODO: improve performance with large polygons
    var p = arcs.getVertex(idsB[0], 0);
    var inside = geom.testPointInRing(p.x, p.y, idsA, arcs);
    return inside;
  }
}