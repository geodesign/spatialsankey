(function() {

// Inspired by the sankey plugin https://github.com/d3/d3-plugins/tree/master/sankey
d3.spatialsankey = function() {
  var spatialsankey = {},
      map = {},
      nodes = {},
      links = {},
      flows = {},
      color;

  // Get or set data for nodes
  spatialsankey.nodes = function(_) {
    if (!arguments.length) return nodes;
    nodes = _;
    // Reverse coordinates for leaflet compliance
    nodes.features.forEach(function(d){d.geometry.coordinates.reverse();});
    return spatialsankey;
  };

  // Get or set data for links
  spatialsankey.links = function(_) {
    if (!arguments.length) return links;
    links = _;
    links.map(function(link){
      // Get target and source features
      var source_feature = nodes.features.filter(function(d) {return d.properties.id == link.source; })[0],
          target_feature = nodes.features.filter(function(d) {return d.properties.id == link.target; })[0];
      // Set coordinates for source and target
      link.source_coords = source_feature.geometry.coordinates;
      link.target_coords = target_feature.geometry.coordinates;
      return link;
    })
    return spatialsankey;
  };

  // Get or set data for flow volumes
  spatialsankey.flows = function(_){
    if (!arguments.length) return flows;
    flows = _;
    // Add flow value to links using IDs
    links.map(function(link){
      var flow = flows.filter(function(flow) {return flow.id == link.id;})[0]
      link.flow = flow.flow;
      return link; 
    });
    // Calculate total inflow value for nodes
    nodes.features.map(function(node){
      // Get all inflows to this node
      var inflows = links.filter(function(link) {return link.target == node.properties.id});
      // Sum inflows and set aggregate value
      node.properties.aggregate_inflows = inflows.reduce(function(memo, link) {return memo + link.flow}, 0);
      return node;
    })
    return spatialsankey
  };

  // Get or set leaflet library (defaults to L)
  spatialsankey.leaflet = function(_) {
    if(!arguments.length) return L;
    L = _;
    return spatialsankey;
  };

  // Get or set leaflet map instance (defaults to map)
  spatialsankey.map = function(_) {
    if(!arguments.length) return map;
    map = _;
    return spatialsankey;
  };

  // Draw link element
  spatialsankey.link = function() {
    // Set default curvature parameters
    var shift = {"x": 0.3, "y": 0.1},
        width = function width(d) {return d.flow;};

    function link(d) {
      var source = map.latLngToLayerPoint(d.source_coords),
          target = map.latLngToLayerPoint(d.target_coords),
          diff = {"x": source.x - target.x, "y": source.y - target.y},
          ctl_source = {"x": source.x - shift.x*diff.x, "y": source.y + shift.y},
          ctl_target = {"x": target.x + shift.x*diff.x, "y": target.y - shift.y};

      return "M" + source.x + "," + source.y
           + "C" + ctl_source.x + "," + ctl_source.y
           + " " + ctl_target.x + "," + ctl_target.y
           + " " + target.x + "," + target.y;
    };

    link.shift = function(_) {
      if (!arguments.length) return shift;
      shift = _;
      return link;
    };

    link.width = function(_){
      if (!arguments.length) return width;
      width = _;      
      return width;
    };

    return link;
  };

  // Draw node circle
  spatialsankey.node = function(){
    var node = {},
        color = d3.scale.linear()
                  .domain([0, 1])
                  .range(["yellow", "red"]);

    node.cx = function(d){
      cx = map.latLngToLayerPoint(d.geometry.coordinates).x;
      if(!cx) return null;
      return cx;
    };
    node.cy = function(d) {
      cy = map.latLngToLayerPoint(d.geometry.coordinates).y;
      if(!cy) return null;
      return cy;
    };
    node.r = function(d) {
      var val = d.properties.aggregate_inflows;
      if(!val) return 0;
      return val;
    };
    node.color = function(_){
      if (!arguments.length) return color;
      color = _;
      return color;
    };
    node.fill = function(d) {
      var diff = d.properties.value - d.properties.min_value,
          range = d.properties.max_value - d.properties.min_value,
          load = diff/range;
      if(!load) load = 0;
      return color(load);
    };
    return node;
  };

  return spatialsankey;
};

})();
