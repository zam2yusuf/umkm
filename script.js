var map = L.map('map').setView([-7.5506298, 110.8606141], 13);

// Empty Layer Group that will receive the clusters data on the fly.
var markers = L.geoJSON(null, {
  pointToLayer: createClusterIcon
}).addTo(map);

// Update the displayed clusters after user pan / zoom.
map.on('moveend', update);

function update() {
  if (!ready) return;
  var bounds = map.getBounds();
  var bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
  var zoom = map.getZoom();
  var clusters = index.getClusters(bbox, zoom);
  markers.clearLayers();
  markers.addData(clusters);
}

// Zoom to expand the cluster clicked by user.
markers.on('click', function(e) {
  var clusterId = e.layer.feature.properties.cluster_id;
  var center = e.latlng;
  var expansionZoom;
  if (clusterId) {
    expansionZoom = index.getClusterExpansionZoom(clusterId);
    map.flyTo(center, expansionZoom);
  }
});

// Retrieve Points data.
var placesUrl = 'https://raw.githubusercontent.com/zam2yusuf/umkm-solo/main/umkm.geojson';
var index;
var ready = false;

jQuery.getJSON(placesUrl, function(geojson) {
  // Initialize the supercluster index.
  index = new Supercluster({
    radius: 60,
    extent: 256,
    maxZoom: 20
  }).load(geojson.features); // Expects an array of Features.

  ready = true;
  update();
});

function createClusterIcon(feature, latlng) {
  if (!feature.properties.cluster) return L.marker(latlng);

  var count = feature.properties.point_count;
  var size =
    count < 100 ? 'small' :
    count < 1000 ? 'medium' : 'large';
  var icon = L.divIcon({
    html: '<div><span>' + feature.properties.point_count_abbreviated + '</span></div>',
    className: 'marker-cluster marker-cluster-' + size,
    iconSize: L.point(40, 40)
  });

  return L.marker(latlng, {
    icon: icon
  });
}

markers.on('click', (e) => {
    if (e.layer.feature.properties.cluster_id) {
      worker.postMessage({
        getClusterExpansionZoom: e.layer.feature.properties.cluster_id,
        center: e.latlng
      });
    }
});

googleStreets = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{
    maxZoom: 22,
  minZoom: 12,
    subdomains:['mt0','mt1','mt2','mt3']
});
googleStreets.addTo(map);

L.Control.geocoder().addTo(map);