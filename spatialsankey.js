d3.spatialsankey = function() {
  var spatialsankey = {},
      map = {},
      network = {},
      links = {},
      flows = {},
      color;

  spatialsankey.network = function(_) {
    if (!arguments.length) return network;
    network = _;
    // Reverse coordinates for leaflet compliance
    network.features.forEach(function(d){d.geometry.coordinates.reverse();});
    return spatialsankey;
  };

  spatialsankey.links = function(_) {
    if (!arguments.length) return links;
    links = _;
    links.map(function(link){
      // Get target and source features
      var source_feature = network.features.filter(function(d) {return d.properties.id == link.source; })[0],
          target_feature = network.features.filter(function(d) {return d.properties.id == link.target; })[0];
      // Set coordinates for source and target
      link.source_coords = source_feature.geometry.coordinates;
      link.target_coords = target_feature.geometry.coordinates;
      return link;
    })
    return spatialsankey;
  };
  spatialsankey.flows = function(_){
    if (!arguments.length) return flows;
    flows = _;
    links.map(function(link){
      // debugger
      var flow = flows.filter(function(flow) {return flow.id == link.id;})[0]
      link.flow = flow.flow;
      return link; 
    });
    return spatialsankey
  };

  spatialsankey.leaflet = function(_) {
    if(!arguments.length) return L;
    L = _;
    return spatialsankey;
  };

  spatialsankey.map = function(_) {
    if(!arguments.length) return map;
    map = _;
    return spatialsankey;
  };

  spatialsankey.link = function() {
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
      var val = d.properties.value;
      if(!val) return 0;
      // return val;
      return val/2;
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

