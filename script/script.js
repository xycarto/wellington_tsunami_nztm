$(function(){

  //map;

  //initFullscreen();
  
  //initMap();

  initInfo();

  function initInfo(){ 
    $('.toggle-info').on('click',function(e){
      e.preventDefault();
      if ($('.information').hasClass('hidden')){
        $('.information').removeClass('hidden');
      }else{
        $('.information').addClass('hidden');
      }
    });

    $('.information').on('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      $('.information').addClass('hidden');
    });
    $('.information-box').on('click',function(e){
      e.stopPropagation();
    });
  }

  //toggle suburb view 
  document.getElementById("menu-ui").onclick = function() { 
    suburb.setVisible(!suburb.getVisible());
  };  

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
          html: ['<a href="http://xycarto.com">XYCarto 2020</a>']
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

  /*var tsunami_topo = new ol.layer.Vector({
    source: new ol.source.Vector({
      url: 'https://xycarto.github.io/wellington_tsunami_nztm/json/tsunami_nztm.json',
      format: new ol.format.TopoJSON({
        layers: ['geometries']
      }),
      overlaps: false,
      style: tsu_style
    })
  });*/

  var tsu_style = new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(0,0,0,0)'
    }),
    stroke: new ol.style.Stroke({
      color: 'rgba(255,0,0,1)',
      width: 1
    })
  });

  var tsunami = new ol.layer.Vector({
    source: new ol.source.Vector({
      url: '~/xycarto-base-maps-data/wellington-region-nztm-aerialdsm/kx-wellington-region-tsunami-evacuation-zones-SHP/tsunami_nztm_topo.json',
      format: new ol.format.TopoJSON({
        layers: ['tsunami_nztm'],
        dataProjection: projection
      }),
      projection: projection
    }),
    style: tsu_style
  });
  

  //transform color in json to rgba
  function getRGBa(colorCode) {
    if (colorCode === "yellow") {return 'rgba(255, 255, 0, 0.5)'}
    else if (colorCode === "red") {return 'rgba(255, 0, 0, 0.5)'}
    else {return 'rgba(255, 165, 0, 0.5)'}
  }



  /*var textStyle =  new ol.style.Text({
    font: '12px Calibri,sans-serif',
    fill: new ol.style.Fill({
      color: '#000'
    }),
    label: '${Location}'
  })*/

  var getText = function(feature) {
    var text = feature.get('suburb');
    return text;
};

  var createTextStyle = function(feature) {
    return new ol.style.Text({
      textAlign: 'center',
      textBaseline: 'middle',
      font: 'bold 15px sans-serif',
      overflow: true,
      text: getText(feature),
      fill: new ol.style.Fill({color: 'rgba(250,250,250,1.0'}),
      stroke: new ol.style.Stroke({color: 'rgba(20,20,20,0.75)', width: 1.0})
    });
  };

  //build json layers
  var tsunami = new ol.layer.Vector({
    source: new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        url: 'https://xycarto.github.io/wellington_tsunami_nztm/json/tsunami_nztm.geojson',
        projection: projection
    }),
    style: function (feature) {
      //console.log(feature.getProperties()); // <== all geojson properties
      return [new ol.style.Style({
        fill: new ol.style.Fill({ 
          color: getRGBa(feature.get('Col_Code')),
        }),
        stroke: new ol.style.Stroke({
          color: feature.get('Col_Code'),
          width: 0.5
        })
      })];
    }
  });

  var suburb = new ol.layer.Vector({
    visible: false,
    source: new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        url: 'https://xycarto.github.io/wellington_tsunami_nztm/json/suburb_boundaries.geojson',
        projection: projection
    }),
    style: function (feature) {
      //console.log(feature.getProperties()); // <== all geojson properties
      return [new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'rgba(250, 250, 250, 0.75)',
          width: 1.25
        }),
        text: createTextStyle(feature),
      })];
    },
    declutter: true,
    maxResolution: 14
  });

  //build map
  var map = new ol.Map({
    target: "map",
    layers: [layer, tsunami, suburb],
    view: new ol.View({
      projection: projection,
      center: ol.proj.transform([174.8, -41.29], "EPSG:4326", "EPSG:2193"),
      minZoom: 6,
      maxZoom: 11,
      zoom: 9,
      resolutions: resolutions
    })
  });

  //test for resolution usage
  var currReso = map.getView().getResolution();
  map.on('moveend', function(e) {
    var newReso = map.getView().getResolution();
    if (currReso != newReso) {
      console.log('zoom end, new zoom: ' + newReso);
      currReso = newReso;
    }
  });
  
    //var resolution = map.getView().getResolution();
    //console.log(resolution);
  
  /* FULLSCREEN   ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
  function initFullscreen() {
    // if embedded offer fullscreen
    if (top !== self) {
      $('body').removeClass('standalone');
      var wasFullScreen = fullScreenApi.isFullScreen(),
        resizeTimer;
      $(window).on('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resized, 300);
      });

      function resized() {
        if (wasFullScreen !== fullScreenApi.isFullScreen()) { // fullscreen mode has changed
          if (wasFullScreen) {
            $('body').removeClass('fullscreen');
            resetMapView();
            // you have just EXITED full screen
          } else {
            $('body').addClass('fullscreen');
            resetMapView();
            // you have just ENTERED full screen
          }
          wasFullScreen = fullScreenApi.isFullScreen();
        }
      }
      // if not embedded treat as fullscreen
      if (top === self) {
        $('body').addClass('standalone');
      }
      $("a[data-toggle='fullscreen']").attr("href", settings.map_url);
      $("a[data-toggle='fullscreen']").click(function (e) {
        // if embedded and fullscreen support
        // also excluding webkit browsers for now
        var webkit = /webkit/.test(navigator.userAgent.toLowerCase());
        if (top !== self && fullScreenApi.supportsFullScreen && !webkit) {
          e.preventDefault();
          $('html').requestFullScreen();
        }
      });
      $("a[data-toggle='fullscreen-close']").attr("href", settings.parent_url);
      $("a[data-toggle='fullscreen-close']").click(function (e) {
        // if embedded and fullscreen support
        if (top !== self && fullScreenApi.supportsFullScreen) {
          e.preventDefault();
          $('html').cancelFullScreen();
        }
      });
    }
  } 

  $(window).on('resize', function () {
    setMinZoom();
    updateMapView();
  });
  
})