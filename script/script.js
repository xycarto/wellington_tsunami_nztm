// set NZTM projection extent so OL can determine zoom level 0 extents.

proj4.defs("EPSG:2193","+proj=tmerc +lat_0=0 +lon_0=173 +k=0.9996 +x_0=1600000 +y_0=10000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

var projection = ol.proj.get("EPSG:2193");
projection.setExtent([827933.23, 3729820.29, 3195373.59, 7039943.58]);

// NZTM tile matrix origin, resolution and matrixId definitions.
var origin = [-1000000, 10000000];
var resolutions = [
  8960,
  4480,
  2240,
  1120,
  560,
  280,
  140,
  70,
  28,
  14,
  7,
  2.8,
  1.4,
  0.7,
  0.28,
  0.14,
  0.07
];
var matrixIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

// Use WMTS template for accessing base map
var urlTemplate =
  "https://xycarto-base-maps.s3-ap-southeast-2.amazonaws.com/wellington-region-nztm-aerialdsm/tile-cache/20200302/wellington-region-nztm-aerialdsm/{TileMatrix}/{TileCol}/{TileRow}.png";

// Set raster layer
var layer = new ol.layer.Tile({
  source: new ol.source.WMTS({
    url: urlTemplate,
    requestEncoding: "REST",
    attributions: [
      new ol.Attribution({
        html: ['<a href="http://data.linz.govt.nz">LINZ. CC BY 4.0</a>']
      })
    ],
    projection: projection,
    tileGrid: new ol.tilegrid.WMTS({
      origin: origin,
      resolutions: resolutions,
      matrixIds: matrixIds
    })
  })
});

//transform color in json to rgba
function getRGBa(colorCode) {
  if (colorCode === "yellow") {return 'rgba(255, 255, 0, 0.5)'}
  else if (colorCode === "red") {return 'rgba(255, 0, 0, 0.5)'}
  else {return 'rgba(255, 165, 0, 0.5)'}
}

var tsunami = new ol.layer.Vector({
  source: new ol.source.Vector({
      format: new ol.format.GeoJSON(),
      url: 'https://xycarto.github.io/wellington_tsunami_nztm/json/tsunami_nztm.geojson',
      projection: projection
  }),
  style: function (feature, resolution) {
    console.log(feature.getProperties()); // <== all geojson properties
    return [new ol.style.Style({
      fill: new ol.style.Fill({ 
        color: getRGBa(feature.get('Col_Code')),
      }),
      stroke: new ol.style.Stroke({
        color: feature.get('Col_Code'),
        width: 1
      })
    })];
  }
});

// Add base map and icons to website
var map = new ol.Map({
  target: "map",
  layers: [layer, tsunami],
  view: new ol.View({
    projection: projection,
    center: ol.proj.transform([174.8, -41.29], "EPSG:4326", "EPSG:2193"),
    zoom: 9
  })
});
