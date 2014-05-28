d3.spatialsankey = function() {
  var spatialsankey = {},
      data = {},
      map = {};

  spatialsankey.data = function(_) {
    if (!arguments.length) return data;
    data = _;
    data.links.forEach(function(d){
      d.source = d3.map(data.nodes).get(d.source).data;
      d.target = d3.map(data.nodes).get(d.target).data;
    });
    return spatialsankey;
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
    var shift = {"x": 0.3, "y": 0.1};

    function link(d) {
      var source = map.latLngToLayerPoint([d.source.lat, d.source.lng]),
          target = map.latLngToLayerPoint([d.target.lat, d.target.lng]),
          diff = {"x": source.x - target.x, "y": source.y - target.y},
          ctl_source = {"x": source.x - shift.x*diff.x, "y": source.y + shift.y},
          ctl_target = {"x": target.x + shift.x*diff.x, "y": target.y - shift.y};

      return "M" + source.x + "," + source.y
           + "C" + ctl_source.x + "," + ctl_source.y
           + " " + ctl_target.x + "," + ctl_target.y
           + " " + target.x + "," + target.y;
    }

    link.shift = function(_) {
      if (!arguments.length) return shift;
      shift = _;
      return link;
    };

    return link;
  };

  spatialsankey.linkwidth = function(){
    function width(d) {return d.value;};
    return width;
  };

  spatialsankey.node = {};
  spatialsankey.node.cx = function(d){
    var cx = map.latLngToLayerPoint([d.data.lat, d.data.lng]).x;
    if(!cx) return null;
    return cx;
  };
  spatialsankey.node.cy = function(d) {
    var cy = map.latLngToLayerPoint([d.data.lat, d.data.lng]).y;
    if(!cy) return null;
    return cy;

  };
  spatialsankey.node.r = function(d) {
    var val = d.data.value;
    if(!val) return 0;
    return val;
  };

  spatialsankey.node.color = d3.scale.linear()
                  .domain([0, 1])
                  .range(["yellow", "red"]);

  spatialsankey.node.fill = function(d) {
    var load = (d.data.value - d.data.min_value)/(d.data.max_value - d.data.min_value);
    if(!load) load = 0;
    return spatialsankey.node.color(load);
  }

  spatialsankey.node.mouseover = function(d){
    d3.selectAll('#msg-box').text(d.data.name + ' (' + d.data.type + ')');
  }

  return spatialsankey;
};



