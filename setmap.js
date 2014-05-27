// Set leaflet map
var map = new L.map('map', {
          center: new L.LatLng(26.94922257769204, -80.760498046875),
          zoom: 8,
          minZoom: 0,
          maxZoom: 18
        });

var tonerUrl = "http://{S}tile.stamen.com/toner-lite/{Z}/{X}/{Y}.png";
 
var url = tonerUrl.replace(/({[A-Z]})/g, function(s) {
  return s.toLowerCase();
});
 
var basemap = L.tileLayer(url, {
  subdomains: ['','a.','b.','c.','d.'],
  minZoom: 0,
  maxZoom: 20,
  type: 'png',
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>'
});
 
basemap.addTo(map);

// Initialize the SVG layer
map._initPathRoot()