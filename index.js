// import L from "leaflet/dist/leaflet.js";
// import 'leaflet/dist/leaflet.css';
import { markets } from "./markets.js";
import { cycles } from "./Cycle.js";

// Define map boundaries
let southWest = L.latLng(49.96, -8.17);
let northEast = L.latLng(58.7, 1.76);
let bounds = L.latLngBounds(southWest, northEast);

// Leaflet Routing Machine instance
let routingControl = null;

// Variables for storing start and end points
let startPoint = null;
let endPoint = null;

// Initialize the map
let map = L.map("map", {
  center: [53.73001, -1.982],
  zoom: 7,
  maxBounds: bounds,
  maxBoundsViscosity: 1.0,
  zoomControl: true,
  fullscreenControl: true,
  fullscreenControlOptions: {
    position: "topleft",
  },
});

map.zoomControl.setPosition("topright");
map.locate({ setView: false });

// Add tile layer
const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  minZoom: 4,
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

const topo = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
  maxZoom: 17,
  attribution:
    '&copy; <a href="https://www.opentopomap.org/">OpenTopoMap</a> contributors',
});

// Base Layers (Layer Switcher Control)
const baseLayers = {
  OpenStreetMap: osm,
  "Topographic Map": topo,
};

// Define a custom icon
const marketIcon = L.icon({
  iconUrl: "./market.png",
  iconSize: [32, 37],
  iconAnchor: [16, 44],
  popupAnchor: [0, -37],
});

const cycleIcon = L.icon({
  iconUrl: "./cycling.png",
  iconSize: [32, 37],
  iconAnchor: [16, 44],
  popupAnchor: [0, -37],
});

// GeoJSON layers for cycles and markets
const cycle = L.geoJSON(cycles, {
  pointToLayer: function (feature, latlng) {
    return L.marker(latlng, {
      icon: cycleIcon,
      keyboard: false,
      riseOnHover: true,
    });
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      const popupCycleContent = `
            <strong>Location:</strong> ${feature?.properties["Location "]}<br>
            <strong>Town:</strong> ${feature?.properties?.Town}<br>
            <strong>Description:</strong> ${feature?.properties["Description "]}<br>

            <button id="selectPoint" class="selectPoint">Select Point</button>`;

      layer.bindPopup(popupCycleContent);

      layer.on("click", (e) => {
        map.closePopup(); // Close other popups
        layer.openPopup();

        // Add event listener to the button after popup opens
        setTimeout(() => {
          const button = document.getElementById("selectPoint");
          if (button) {
            button.onclick = () => {
              if (!startPoint) {
                startPoint = e.latlng;
                layer.bindPopup("Start Point Selected").openPopup();
              } else if (!endPoint) {
                endPoint = e.latlng;
                layer.bindPopup("Destination Selected").openPopup();
                drawRoute(startPoint, endPoint);
              } else {
                // Reset if both points are selected already
                startPoint = e.latlng;
                endPoint = null;
                layer.bindPopup("Start Point Reset").openPopup();
              }
            };
          }
        }, 100); // Wait for popup to render button
      });
    }
  },
}).addTo(map);

const market = L.geoJSON(markets, {
  pointToLayer: function (feature, latlng) {
    return L.marker(latlng, {
      icon: marketIcon,
      keyboard: false,
      riseOnHover: true,
    });
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      const popupMarketContent = `
            <strong>Name:</strong> ${feature?.properties?.Market}<br>
            <strong>Description:</strong> ${feature?.properties?.Goods}<br>
            <strong>Telephone:</strong> ${feature?.properties?.Telephone}<br>
            <strong>Timings: </strong> ${feature?.properties["Time open"]} - ${feature?.properties["Time close"]}<br>

            <button id="selectMarket" class="selectMarket">Select Point</button>`;

      layer.bindPopup(popupMarketContent);

      layer.on("click", (e) => {
        map.closePopup();
        layer.openPopup();

        setTimeout(() => {
          const button = document.getElementById("selectMarket");
          if (button) {
            button.onclick = () => {
              if (!startPoint) {
                startPoint = e.latlng;
                layer.bindPopup("Start Point Selected").openPopup();
              } else if (!endPoint) {
                endPoint = e.latlng;
                layer.bindPopup("Destination Selected").openPopup();
                drawRoute(startPoint, endPoint);
              } else {
                startPoint = e.latlng;
                endPoint = null;
                layer.bindPopup("Start Point Reset").openPopup();
              }
            };
          }
        }, 100);
      });
    }
  },
}).addTo(map);

// Function to handle route drawing
function drawRoute(start, end) {
  if (routingControl) {
    map.removeControl(routingControl);
  }
  routingControl = L.Routing.control({
    waypoints: [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)],
    routeWhileDragging: true,
  }).addTo(map);
}

const overlayLayers = {
  Cycles: cycle,
  Markets: market,
};

// Add Layer Control to Map
L.control
  .layers(baseLayers, overlayLayers, { position: "bottomright" })
  .addTo(map);

L.Control.geocoder({
  collapsed: false,
  position: "topleft",
  placeholder: "Search...",
  errorMessage: "No results found",
  geocoder: L.Control.Geocoder.nominatim({
    geocodingQueryParams: {
      countrycodes: "GB",
    },
  }),
}).addTo(map);

// Add Locate Control
L.control
  .locate({
    position: "topleft",
    drawCircle: true,
    follow: true,
    setView: "untilPan",
    keepCurrentZoomLevel: true,
    markerStyle: {
      weight: 1,
      opacity: 0.8,
      fillOpacity: 0.8,
    },
    circleStyle: {
      weight: 1,
      clickable: false,
    },
    icon: "fa fa-location-crosshairs",
  })
  .addTo(map);
