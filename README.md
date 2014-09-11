Sankey diagrams on a map
========================
D3 Plugin for visualizing flows through a network on a leaflet map.

Here is a small [example application](http://bl.ocks.org/yellowcap/03cd4a6c72f661377f7e) of the plugin.

The spatialsankey plugin is inspired by the d3-plugin [sankey](https://github.com/d3/d3-plugins/tree/master/sankey) and the the example integration of D3 elements into a leaflet map follows the [D3 + Leaflet](http://bost.ocks.org/mike/leaflet/) tutorial.

To use it, prepare a set of points as geojson and an array of link values as either csv or json. The links are defined as an array of objects with a source, target and flow value. The source and targets are the point IDs from the geojson points. Example data snippets are shown below.

After loading the data, the links can be displayed on a leaflet map with just a few lines of code:

```js
// Instantiate spatial sankey
var spatialsankey = d3.spatialsankey()
                      .lmap(map)
                      .nodes(nodes.features)
                      .links(links);

// Draw nodes
var node = spatialsankey.node();
var circs = nodelayer.selectAll("circle")
                     .data(spatialsankey.nodes())
                     .enter()
                     .append("circle")
                     .attr("cx", node.cx)
                     .attr("cy", node.cy)
                     .attr("r", node.r)
                     .style("fill", node.fill);
                     
// Draw links
link = spatialsankey.link();
var beziers = linklayer.selectAll("path")
                       .data(nodelinks);
                       .enter()
                       .append("path")
                       .attr("d", link)
                       .attr('id', function(d){return d.id})
                       .style("stroke-width", linke.width())
                       .style("fill", 'none');
```

nodes.geojson
--------------------
```js
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "AD",
      "geometry": {
        "type": "Point",
        "coordinates": [ 1.6002, 42.5462 ]
      }
    },
    {
      "type": "Feature",
      "id": "AE",
      "geometry": {
        "type": "Point",
        "coordinates": [ 53.9791, 23.4330 ]
      }
    },
    {
      "type": "Feature",
      "id": "AF",
      "geometry": {
        "type": "Point",
        "coordinates": [ 65.5818, 33.6508 ]
      }
    }
]}
```

links.csv
-----------
```
target,source,flow
AD,AE,23230
AD,AF,371
AF,AE,1310
```