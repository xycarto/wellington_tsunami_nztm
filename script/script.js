// set NZTM projection extent so OL can determine zoom level 0 extents.
var projection = ol.proj.get("EPSG:2193");
projection.setExtent([827933.23, 3729820.29, 3195373.59, 7039943.58]);

// NZTM tile matrix origin, resolution and matrixId definitions. See the LDS tile set definition document for more information
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
  "https://tiles.maps.linz.io/nz_topo_basemap/NZTM/{TileMatrix}/{TileCol}/{TileRow}.png";

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

// Your LDS API key is necessary to access the WFS service
var APIKey = "4e94c8593d144cdf814a8b0b4525dc6a";

// Set WFS layer (pa points)
var vectorSource = new ol.source.Vector({
  loader: function(extent) {
    //use ajax to communicate with server to get WFS
    $.ajax("https://data.linz.govt.nz/services;key=" + APIKey + "/wfs", {
      type: "GET",
      data: {
        service: "WFS",
        version: "1.1.0",
        request: "GetFeature",
        typename: "layer-50308",
        srsname: "EPSG:2193",
        outputformat: "JSON", //Can just default to GML
        bbox: extent.join(",") + ",EPSG:2193"
      }
    }).done(loadFeatures);
  },
  strategy: ol.loadingstrategy.tile(
    ol.tilegrid.createXYZ({
      maxZoom: 19
    })
  )
});

// Load features of WFS layer as GeoJSON
loadFeatures = function(response) {
  //change format below depending on output format
  //format = new ol.format.WFS();
  format = new ol.format.GeoJSON();
  vectorSource.addFeatures(format.readFeatures(response));
};

// Retrieve icon
var icon = new ol.style.Icon({
  anchor: [0.5, 0.5],
  size: [52, 52],
  offset: [0, 0],
  opacity: 1,
  scale: 1.0,
  src: "https://openlayers.org/en/v3.20.1/examples/data/icon.png"
});

// Set icon style
var iconStyle = new ol.style.Style({
  image: icon
});

// Set up WFS as vector layer and add icons
var vector = new ol.layer.Vector({
  source: vectorSource,
  updateWhileAnimating: true,
  updateWhileInteracting: true,
  style: iconStyle,
  //lock icon scale. TODO: set so icon does nto change in size up until resoultion 28, then switches to dynamic sizing
  //style: function(feature, resolution) {
    //iconStyle.getImage().setScale(map.getView().getResolutionForZoom(9) / resolution);
    //return iconStyle;
  //}
  maxResolution: 28
});

// Add base map and icons to website
var map = new ol.Map({
  target: "map",
  layers: [layer, vector],
  view: new ol.View({
    projection: projection,
    center: ol.proj.transform([175.1031, -36.8158], "EPSG:4326", "EPSG:2193"),
    zoom: 9
  })
});
