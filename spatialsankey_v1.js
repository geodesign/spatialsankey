// We simply pick up the SVG from the map object
var svg = d3.select("#map").select("svg"),
    g = svg.append("g");

d3.json("bla.json", function(collection) {

  collection.d3data = [];

  /* Add a LatLng object to each item in the dataset */
  collection.features.forEach(function(d) {

    // Get Leaflet Lat Long coordinates from features
    var Start = new L.LatLng(d.geometry.coordinates[0][0], d.geometry.coordinates[0][1]),
        End = new L.LatLng(d.geometry.coordinates[1][0], d.geometry.coordinates[1][1]);

    // Set control points for interpolation
    var slat = 0.3,
        slng = 0.05,
        dlat = Start.lat - End.lat,
        dlng = Start.lng - End.lng,
        Start_ctl = {lat: Start.lat - slat*dlat, lng: Start.lng + slng*dlat},
        End_ctl = {lat: End.lat + slat*dlat, lng: End.lng - slng*dlat};

    // Add flow volume to starting point for rendering width
    Start.flow = d.properties.flow;
    Start.flow_max = d.properties.flow_max;
    Start.flow_min = d.properties.flow_min;

    // Set D3 object data to use for path rendering
    collection.d3data.push([Start, Start_ctl, End_ctl, End]);
  });

  var linePositioning = d3.svg.line()
        .x(function(d) { return map.latLngToLayerPoint(d).x; })
        .y(function(d) { return map.latLngToLayerPoint(d).y; })
        .interpolate("basis");

  var lineWidth = function(d){return d[0].flow};

  var color = d3.scale.linear()
      .domain([0, 1])
      .range(["yellow", "red"]);

  var lineColor = function(d){return color((d[0].flow - d[0].flow_min)/(d[0].flow_max - d[0].flow_min))};

  var graph = g.selectAll("path")
                  .data(collection.d3data)
                  .enter()
                  .append("path")
                  .attr('d', linePositioning)
                  .attr("stroke-width", lineWidth)
                  .attr('stroke', lineColor);

  function update() {
    graph.attr("d",linePositioning);
  };

  map.on("viewreset", update);

  map.on('moveend', function(){
    graph.transition()
          .attr('stroke-width', function(d){return 5 + 30*Math.random()})
          .attr('stroke', function(d){return color(Math.random())});
    console.log(map.getCenter())
  });
});