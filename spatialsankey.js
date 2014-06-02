(function() {

// Inspired by the sankey plugin https://github.com/d3/d3-plugins/tree/master/sankey
d3.spatialsankey = function() {
  var spatialsankey = {},
      map = {},
      nodes = {},
      links = {},
      flows = {},
      node_flow_range = {},
      link_flow_range = {};

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
    // Add coordinates to links
    links.map(function(link){
      // Get target and source features
      var source_feature = nodes.features.filter(function(d) { return d.properties.id == link.source; })[0],
          target_feature = nodes.features.filter(function(d) { return d.properties.id == link.target; })[0];
      // Set coordinates for source and target
      link.source_coords = source_feature.geometry.coordinates;
      link.target_coords = target_feature.geometry.coordinates;
      return link;
    })
    return spatialsankey;
  };

  // Get or set data for flow volumes
  spatialsankey.flows = function(_) {
    if (!arguments.length) return flows;
    flows = _;
    // Add flow value to links using IDs
    links.map(function(link){
      var flow = flows.filter(function(flow) { return flow.id == link.id; })[0]
      link.flow = flow.flow;
      return link; 
    });
    // Calculate total inflow value for nodes
    nodes.features.map(function(node) {
      // Get all inflows to this node
      var inflows = links.filter(function(link) { return link.target == node.properties.id; });
      // Sum inflows and set aggregate value
      node.properties.aggregate_inflows = inflows.reduce(function(memo, link) { return memo + link.flow; }, 0);
      return node;
    });
    // Calculate ranges of values for links and nodes
    link_flow_range.min = d3.min(links, function(link) { return link.flow; });
    link_flow_range.max = d3.max(links, function(link) { return link.flow; });
    node_flow_range.min = d3.min(nodes.features, function(feature) { return feature.properties.aggregate_inflows; });
    node_flow_range.max = d3.max(nodes.features, function(feature) { return feature.properties.aggregate_inflows; });
    return spatialsankey;
  };

  // Draw link element
  spatialsankey.link = function() {
    // Set default curvature parameters
    var shift = {"x": 0.3, "y": 0.1},
        width_range = {min: 2, max: 8};
    
    // Calculate widht based on data range and with specifications
    var width = function width(d) {
          var diff = d.flow - link_flow_range.min,
              range = link_flow_range.max - link_flow_range.min;
          return (width_range.max - width_range.min)*(diff/range) + width_range.min;
        };
    
    // Define path drawing function
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

    link.width = function(_) {
      if (!arguments.length) return width;
      width = _;      
      return width;
    };

    link.width_range = function(_) {
      if (!arguments.length) return width_range;
      width_range = _;
      return width_range;
    };

    return link;
  };

  // Draw node circle
  spatialsankey.node = function(){
    var node = {},
        node_radius_range = {min: 10, max: 30},
        node_color_range = ["yellow", "red"],
        color = d3.scale.linear()
                  .domain([0, 1])
                  .range(node_color_range);

    node.cx = function(d) {
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
      var diff = d.properties.aggregate_inflows - node_flow_range.min,
          range = node_flow_range.max - node_flow_range.min;
      return (node_radius_range.max - node_radius_range.min)*(diff/range) + node_radius_range.min;
    };
    node.color = function(_) {
      if (!arguments.length) return color;
      color = _;
      return color;
    };
    node.color_range = function(_) {
      if (!arguments.length) return node_color_range;
      node_color_range = _;
      return node_color_range;
    };
    node.fill = function(d) {
      var diff = d.properties.aggregate_inflows - node_flow_range.min,
          range = node_flow_range.max - node_flow_range.min,
          load = diff/range;
      return color(load);
    };
    return node;
  };

  return spatialsankey;
};

})();
