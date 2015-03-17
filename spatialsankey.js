(function() {

d3.spatialsankey = function() {
  // Define control variables
  var spatialsankey = {},
      map,
      nodes = {},
      links = [],
      flows = [],
      node_flow_range = {},
      link_flow_range = {},
      remove_zero_links = true,
      remove_zero_nodes = true,
      version = '0.0.5';

  // Get or set leaflet map instance
  spatialsankey.lmap = function(_) {
    if(!arguments.length) return map;
    map = _;
    return spatialsankey;
  };

  // Get or set data for nodes
  spatialsankey.nodes = function(_) {
    if (!arguments.length) return nodes;
    nodes = _;
    // Reduce data to feature list
    if(nodes.features) nodes = nodes.features;
    // GeoJson uses lon/lat, leaflet uses lat/lon, so coordinates need to be reversed
    nodes.forEach(function(d){d.geometry.coordinates.reverse();})
    return spatialsankey;
  };

  // Get or set data for flow volumes (optional)
  spatialsankey.flows = function(_) {
    if (!arguments.length) return flows;
    flows = _;    
    return spatialsankey;
  };

  // Calculates ranges for flows and nodes used for node radii and flow width drawing
  spatialsankey.ranges = function() {
    // Calculate aggregate flow values for nodes
    nodes = nodes.map(function(node) {
      // Get all in and outflows to this node
      var inflows = links.filter(function(link) { return link.target == node.id; });
      var outflows = links.filter(function(link) { return link.source == node.id; });

      // Sum flows and set aggregate values
      node.properties.aggregate_inflows = inflows.reduce(function(memo, link) { return memo + link.flow; }, 0);
      node.properties.aggregate_outflows = outflows.reduce(function(memo, link) { return memo + link.flow; }, 0);

      return node;
    });

    // Calculate gobal ranges of values for links and nodes
    link_flow_range.min = d3.min(links, function(link) { return link.flow; });
    link_flow_range.max = d3.max(links, function(link) { return link.flow; });

    node_flow_range.min = d3.min(nodes, function(node) {
      var inflow = node.properties.aggregate_outflows;
      return inflow == 0 ? null : inflow;
    });
    node_flow_range.max = d3.max(nodes, function(node) { return node.properties.aggregate_outflows; });

    return {links: link_flow_range, nodes: node_flow_range};
  };

  // Get or set data for links
  spatialsankey.links = function(_) {
    if (!arguments.length) return links;
    links = _;
    // Match nodes to links
    links = links.map(function(link){

      // Get target and source features
      var source_feature = nodes.filter(function(node) { return node.id == link.source; })[0],
          target_feature = nodes.filter(function(node) { return node.id == link.target; })[0];

      // If nodes were not found, return null
      if (!(source_feature && target_feature)) return null;
      
      // Set coordinates for source and target      
      link.source_coords = source_feature.geometry.coordinates;
      link.target_coords = target_feature.geometry.coordinates;

      // If a flow for this link was specified, set flow value
      var flow = flows.filter(function(flow) { return flow.id == link.id; })[0];
      if (flow) {
        link.flow = flow.flow;
      }
      
      // Make sure flow is a number
      link.flow = parseFloat(link.flow);
    
      return link;
    });

    // Ignore links that have no node match
    var link_count = links.length;
    links = links.filter(function(link){ return link != null});
    if(link_count != links.length){
      console.log('Dropped ' + (link_count - links.length) + ' links that could not be matched to a node.');
    }
    
    // Calculate ranges for dynamic drawing
    spatialsankey.ranges();

    return spatialsankey;
  };

  // Draw link element
  spatialsankey.link = function(options) {
    
    // Link styles
    // x and y shifts for control points
    var sx = 0.4,
        sy = 0.1;
    // With range of lines, set min and max to be equal for a constant width.
    var width_range = {min: 1, max: 8};
    // If true, links are only shown if there is a flow value for them
    var hide_zero_flows = true;
    // Use arcs instead of S shaped bezier curves
    var arcs = false;
    // If true, lines are flipped along x axis
    var flip = false;

    // Customize link styles using options
    if(options){
      if(options.xshift) sx = options.xshift;
      if(options.yshift) sy = options.yshift;
      if(options.minwidth) width_range.min = options.minwidth;
      if(options.maxwidth) width_range.max = options.maxwidth;
      if(options.use_arcs) arcs = options.use_arcs;
      if(options.flip) flip = options.flip;
    }

    // Define path drawing function
    var link = function(d) {
      // Set control point inputs
      var source = map.latLngToLayerPoint(d.source_coords),
          target = map.latLngToLayerPoint(d.target_coords),
          dx = source.x - target.x,
          dy = source.y - target.y;

      // Determine control point locations for different link styles
      if(!arcs){
        if(dy < 0 || flip){
          var controls = [sx*dx, sy*dy, sx*dx, sy*dy]
        } else {
          var controls = [sy*dx, sx*dy, sy*dx, sx*dy]
        }
      } else  {
        if(dy < 0 || flip){
          var controls = [sx*dx, sy*dy, sy*dx, sx*dy];
        } else {
          var controls = [sy*dx, sx*dy, sx*dx, sy*dy];
        }
      }

      return "M" + source.x + "," + source.y
           + "C" + (source.x - controls[0]) + "," + (source.y - controls[1])
           + " " + (target.x + controls[2]) + "," + (target.y + controls[3])
           + " " + target.x + "," + target.y;
    };

    // Calculate width based on data range and width range setting
    var width = function(d) {
          // Don't draw flows with zero flow unless zero is the minimum
          if(d.flow == 0 && link_flow_range.min != 0) return 0;
          // Calculate width value based on flow range
          var diff = d.flow - link_flow_range.min,
              range = link_flow_range.max - link_flow_range.min;
          return (width_range.max - width_range.min)*(diff/range) + width_range.min;
        };
    
    // Get or set link width function
    link.width = function(_) {
      if (!arguments.length) return width;
      width = _;
      return width;
    };

    return link;
  };

  // Draw node circle
  spatialsankey.node = function(options){
    // Node styles
    // Range of node circles (set min and max equal for constant circle size)
    var node_radius_range = {min: 10, max: 20};
    // Range for color coding according to flow size (set colors for single coloring)
    node_color_range = ["yellow", "red"];
    // Instantiate color scale function
    var color = d3.scale.linear()
                  .domain([0, 1])
                  .range(node_color_range);

    // Customize link styles using options
    if(options){
      if(options.minradius) node_radius_range.min = options.minradius;
      if(options.maxradius) node_radius_range.max = options.maxradius;
      if(options.mincolor) node_color_range[0] = options.mincolor;
      if(options.maxcolor) node_color_range[1] = options.maxcolor;
    }

    // Node object
    var node = {};

    // Node object properties
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
      if (d.properties.aggregate_outflows == 0) return 0;
      var diff = d.properties.aggregate_outflows - node_flow_range.min,
          range = node_flow_range.max - node_flow_range.min;
      return (node_radius_range.max - node_radius_range.min)*(diff/range) + node_radius_range.min;
    };
    node.color = function(_) {
      if (!arguments.length) return color;
      color = _;
      return node;
    };
    node.fill = function(d) {
      var diff = d.properties.aggregate_outflows - node_flow_range.min,
          range = node_flow_range.max - node_flow_range.min,
          load = diff/range;
      return color(load);
    };
    return node;
  };

  return spatialsankey;
};

})();
