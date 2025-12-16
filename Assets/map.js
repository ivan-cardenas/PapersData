
    /* ---------------- MAPBOX INITIALIZATION ---------------- */
    mapboxgl.accessToken =
      "pk.eyJ1IjoiY3lnbnVzMjYiLCJhIjoiY2s5Z2MzeWVvMGx3NTNtbzRnbGtsOXl6biJ9.8SLdJuFQzuN-s4OlHbwzLg";

    const BASEMAPS = {
      light: "mapbox://styles/mapbox/light-v11",
      satellite: "mapbox://styles/mapbox/satellite-streets-v12",
    };

    let activeBasemap = "light";

    const map = new mapboxgl.Map({
      container: "map",
      style: BASEMAPS[activeBasemap],
      center: [6.895, 52.219], // pick whatever matches your area
      zoom: 16,
      pitch: 60,
      bearing: -35,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    function restoreCustomLayers() {
      // 3D buildings (Mapbox standard example)
      const layers = map.getStyle().layers;
      let labelLayerId;
      for (const layer of layers) {
        if (layer.type === "symbol" && layer.layout["text-field"]) {
          labelLayerId = layer.id;
          break;
        }
      }

      // ---------------- ADD SOURCES  ----------------
      if (!map.getSource("heat-grid")) {
        map.addSource("heat-grid", {
          type: "geojson",
          data: "./Assets/Heat_Enschede.json",
        });
      }

      if (!map.getLayer("heat-hex")) {
        map.addSource("green-areas", {
          type: "geojson",
          data: "./Assets/Green_area.geojson",
        });
      }

      if (!map.getLayer("Water_Pipes")) {
        map.addSource("Water_Pipes", {
          type: "geojson",
          data: "./Assets/Pipes_Water_WGS84.geojson",
        });
      }

      if (!map.getLayer("groundwater-level")) {
        map.addSource("groundwater-level", {
          type: "raster",
          tiles: [
    "https://service.pdok.nl/bzk/bro-grondwaterspiegeldiepte/wms/v2_0" +
    "?service=WMS&request=GetMap&version=1.3.0" +
    "&layers=bro-grondwaterspiegeldieptemetingen-GHG" +
    "&styles=" +
    "&format=image/png" +
    "&transparent=true" +
    "&width=256&height=256" +
    "&crs=EPSG:3857" +
    "&bbox={bbox-epsg-3857}"
  ],
        });
      }


      // ---------------- ADD LAYERS  ----------------
      if (!map.getLayer("green-areas")) {
        map.addLayer({
          id: "green-areas",
          type: "fill",
          source: "green-areas",
          paint: {
            "fill-color": "#7bab45",
            "fill-opacity": 0.5,
            "fill-sort-key": 0,
            "fill-z-offset": 0
          },
          visible: false,
        });
      }

      if (!map.getLayer("water-pipes")) {
        map.addLayer({
          id: "water-pipes",
          type: "line",
          source: "Water_Pipes",
          'layout': {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            "line-color": "#3db9d7",
            "line-width": 2,
            "line-elevation-reference": "ground",
            "line-z-offset": -10

          },
          visible: true,
        })

      }

      if (!map.getLayer("heat-hex")) {
        map.addLayer({
          id: "heat-hex",
          type: "fill-extrusion",
          source: "heat-grid",
          paint: {
            "fill-extrusion-color": [
              "interpolate",
              ["linear"],
              ["get", "MEDIAN"],
              41,
              "#7bab45",
              43,
              "#ff1f21",
            ],
            "fill-extrusion-height": [
              "interpolate",
              ["linear"],
              ["get", "MEDIAN"],
              41,
              0,
              43,
              300,
            ],
            "fill-extrusion-opacity": 0.9,
          },
          visible: false,
        });
      }

      if (!map.getLayer("groundwater-level")) {
        map.addLayer({
          id: "groundwater-level",
          type: "raster",
          source: "groundwater-level",
          visible: false,
        });
      }

      // ---------------- 3D BUILDINGS ----------------
      if (!map.getLayer("3d-buildings")) {
        map.addLayer(
          {
            id: "3d-buildings",
            source: "composite",
            "source-layer": "building",
            filter: ["==", ["get", "extrude"], "true"],
            type: "fill-extrusion",
            minzoom: 13,
            paint: {
              "fill-extrusion-color": "#d0e0f0",
              "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                13,
                0,
                16,
                ["get", "height"],
              ],
              "fill-extrusion-base": [
                "interpolate",
                ["linear"],
                ["zoom"],
                13,
                0,
                16,
                ["get", "min_height"],
              ],
              "fill-extrusion-opacity": 0.8,
              "fill-extrusion-cast-shadows": true,
              "fill-extrusion-ambient-occlusion-intensity": 0.8,
              "fill-extrusion-base-alignment": "terrain",
            },
          },
          labelLayerId
        );
      }

    }
    const popupLayers = ["heat-hex", "green-areas", "water-pipes", "groundwater-level"];

    popupLayers.forEach(layer => {
      map.on("click", layer, (e) => {
        const f = e.features[0];

        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
              <h4>${f.layer.id}</h4>
              <p style="color: #000000">${Object.entries(f.properties)
              .map(([k, v]) => `<strong>${k}:</strong> ${v}`)
              .join("<br>")}
              </p>
            `)
          .addTo(map);
      });

      // Optional: change cursor on hover
      map.on("mouseenter", layer, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", layer, () => {
        map.getCanvas().style.cursor = "";
      });
    });

    map.on("load", () => {
      restoreCustomLayers();
    });



    // ---------------- TOOLBAR INITIALIZATION ----------------
    // Map toolbar tools to the Mapbox layer IDs you want to toggle
    // ⬇️ replace these with your real layer IDs
    const TOOL_LAYERS = {
      overview: ["3d-buildings"], // no extra layer
      temperature: ["heat-hex", "heat-labels"],
      transport: ["pt-lines", "pt-stops"],
      energy: ["energy-buildings"],
      mobility: ["traffic-flows"],
      green: ["green-areas", "trees"],
      water: ["water-pipes", "wells", ],
      emissions: ["co2-grid"],
      groundwater: ["groundwater-level"],
      satellite: [],
    };

    // turn all tool layers off, then turn the ones for the active tool on
    function setToolVisibility(toolId) {
      const allToolLayerIds = [...new Set(Object.values(TOOL_LAYERS).flat())];

      allToolLayerIds.forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, "visibility", "none");
        }
      });

      (TOOL_LAYERS[toolId] || []).forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, "visibility", "visible");
        }
      });
    }




    /* ---------------- UI BEHAVIOUR ---------------- */
    const toolbar = document.getElementById("toolbar");
    const sidePanel = document.getElementById("side-panel");
    const panelTitle = document.getElementById("panel-title");
    const panelBody = document.getElementById("panel-body");

    const TOOL_CONTENT = {
      overview: {
        title: "OVERVIEW",
        body: `
          <p>Global overview of CITY. Use camera tools to explore the
          3D city and select indicators at the bottom to inspect population,
          housing and jobs.</p>
          <p>Switch to any thematic layer on the left to see more detailed
          information here.</p>
        `,
      },
      temperature: {
        title: "URBAN HEAT",
        body: `
          <p>Visualize heat stress hotspots by overlaying land surface
          temperature and tree canopy coverage.</p>
          <p>Use this panel for metrics like average heat index, exposed
          population and priority cooling areas.</p>
        `,
      },
      transport: {
        title: "PUBLIC TRANSPORT",
        body: `
          <p>Show tram and bus corridors, stop accessibility and potential
          transit-oriented development zones.</p>
        `,
      },
      energy: {
        title: "ENERGY DEMAND / SUPPLY",
        body: `
          <p>Overlay building energy demand and local renewable production to
          detect deficits.</p>
        `,
      },
      mobility: {
        title: "TRAFFIC & FLOWS",
        body: `
          <p>Inspect traffic volumes, speeds and active mobility corridors to
          evaluate street network performance.</p>
        `,
      },
      green: {
        title: "GREEN / BLUE INFRASTRUCTURE",
        body: `
          <p>View parks, trees and water bodies. Combine with heat and
          health indicators to locate greening priorities.</p>
        `,
      },
      water: {
        title: "DRINKING WATER",
        body: `
          <p>Show wells, pipes and consumption indicators. Relate demand to
          housing and population forecasts.</p>
        `,
      },
      emissions: {
        title: "EMISSIONS",
        body: `
          <p>Visualize sector-based CO₂ emissions and compare scenarios such
          as business-as-usual vs. mitigation.</p>
        `,
      },
    };

    toolbar.addEventListener("click", (evt) => {
      const btn = evt.target.closest(".tool-button");
      if (!btn) return;

      const tool = btn.dataset.tool;
      toolbar
        .querySelectorAll(".tool-button")
        .forEach((b) => b.classList.toggle("active", b === btn));

      // 🛰️ SWITCH BASEMAP
      if (tool === "satellite") {
        setBasemap("satellite");
      } else {
        setBasemap("light");
      }

      const content = TOOL_CONTENT[tool];
      if (content) {
        panelTitle.textContent = content.title;
        panelBody.innerHTML = content.body;
        sidePanel.classList.add("visible");
      }
      // 🔁 toggle map layers based on the clicked tool
      setToolVisibility(tool);
    });

    document
      .getElementById("panel-close")
      .addEventListener("click", () => sidePanel.classList.remove("visible"));

    document.querySelectorAll(".indicator-pill").forEach((pill) =>
      pill.addEventListener("click", () => {
        const type = pill.dataset.indicator;
        let title = "INDICATOR";
        let body = "";

        if (type === "population") {
          title = "POPULATION";
          body = "<p>Population aligned with current camera extent</p>";
        } else if (type === "housing") {
          title = "HOUSING UNITS";
          body =
            "<p>Number of residential units inside the viewport. Use this " +
            "to compare zoning or scenario options.</p>";
        } else if (type === "jobs") {
          title = "JOBS";
          body = "<p>Estimate of jobs within the current view. </p>";
        }

        panelTitle.textContent = title;
        panelBody.innerHTML = body;
        sidePanel.classList.add("visible");
      })
    );

    const initialView = {
      center: [6.895, 52.219],
      zoom: 13.2,
      pitch: 60,
      bearing: -35,
    };

    document.getElementById("btn-reset").addEventListener("click", () => {
      map.easeTo({
        center: initialView.center,
        zoom: initialView.zoom,
        pitch: initialView.pitch,
        bearing: initialView.bearing,
        duration: 800,
      });
    });

    let tilted = true;
    document.getElementById("btn-tilt").addEventListener("click", () => {
      tilted = !tilted;
      map.easeTo({
        pitch: tilted ? 60 : 0,
        duration: 600,
      });
    });

    const hint = document.getElementById("onboarding-hint");

    toolbar.addEventListener("click", () => {
      if (hint) hint.remove();
    });

    document.getElementById("btn-dashboard").addEventListener("click", () => {
      // mock energy demand data (kWh/m² per month)
      const monthlyDemand = [
        120, 132, 140, 152, 168, 182, 190, 188, 176, 160, 145, 130,
      ];
      const avgDemand =
        monthlyDemand.reduce((sum, v) => sum + v, 0) / monthlyDemand.length;
      const minDemand = Math.min(...monthlyDemand);
      const maxDemand = Math.max(...monthlyDemand);

      panelTitle.textContent = "CITY DASHBOARD";


      const barsHTML = monthlyDemand.map(v => {
        const h = Math.round((v / maxDemand) * 100);
        return `<div class="mini-bar" style="--h:${h}%"></div>`;
      }).join("");



      panelBody.innerHTML = `
      <div class="dashboard-grid">
        <div class="kpi-card">
          <div class="kpi-header">
            <span>Population</span>
            <span class="kpi-dot"></span>
          </div>
          <div class="kpi-value">125,600</div>
          <div class="kpi-sub">+1.2% vs last year</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-header">
            <span>Housing units</span>
            <span class="kpi-dot"></span>
          </div>
          <div class="kpi-value">59,800</div>
          <div class="kpi-sub">Vacancy: 3.4%</div>
        </div>

        <!-- gauges -->
        <div class="gauge-card">
          <div class="gauge-ring" style="--value:72;">
            <div class="gauge-center">72%</div>
          </div>
          <div class="gauge-text">
            <div class="gauge-label">Heat exposure</div>
            <div class="kpi-sub">Population in high-heat hexagons</div>
          </div>
        </div>

        <div class="gauge-card">
          <div class="gauge-ring" style="--value:41;">
            <div class="gauge-center">41%</div>
          </div>
          <div class="gauge-text">
            <div class="gauge-label">Renewable share</div>
            <div class="gauge-sub">Electricity covered by local RES</div>
          </div>
        </div>
      </div>

      <div class="kpi-card" style="margin-top:10px;">
        <div class="kpi-header">
          <span>Energy demand trend</span>
          <span class="kpi-dot"></span>
        </div>
        <div class="mini-chart">
         ${barsHTML}
        </div>
        <div class="kpi-sub" style="margin-top:4px;">
          Monthly demand (kWh/m²): ${monthlyDemand.join(" · ")}<br>
          Avg: ${avgDemand.toFixed(0)} · Min: ${minDemand} · Peak: ${maxDemand}
        </div>
      </div>

      <p class="dashboard-note">
        All values are static placeholders.
      </p>
    `;


      sidePanel.classList.add("visible");
    });

    document.getElementById("btn-scenarios").addEventListener("click", () => {
      panelTitle.textContent = "SCENARIO MANAGER";
      panelBody.innerHTML = `
          <div class="scenario-grid">
           <div class="indicator-pill" data-indicator="Scenario">
            <div class="indicator-icon">'30</div>
            <div class="indicator-meta">
              <span class="indicator-label">Scenario 2030</span>
              <span class="indicator-value" id="house-value">Population: 128,000, Temperature: +1.5°C</span>
            </div>
            
          </div>
            <div class="indicator-pill" data-indicator="Scenario">
            <div class="indicator-icon">'50</div>
            <div class="indicator-meta">
              <span class="indicator-label">Scenario 2050</span>
              <span class="indicator-value" id="house-value">Population: 132,000, Temperature: +2°C</span>
            </div>
          </div>
         
           <p>Here you could switch between baseline, 2030 and 2050 scenarios.</p>
          `;
      sidePanel.classList.add("visible");
    });

    function setBasemap(basemapKey) {
      if (!BASEMAPS[basemapKey]) return;
      if (activeBasemap === basemapKey) return;

      activeBasemap = basemapKey;
      map.setStyle(BASEMAPS[activeBasemap]);

      // Re-add custom layers after style reload
      map.once("style.load", () => {
        restoreCustomLayers();
      });
    }

    const bottomHelper = document.getElementById("bottom-helper");
    function hideBottomHelper() {
      if (bottomHelper) bottomHelper.remove();
    }

    document.getElementById("btn-dashboard").addEventListener("click", hideBottomHelper);
    document.getElementById("btn-scenarios").addEventListener("click", hideBottomHelper);


   function toggleGroundwaterLayer() {
  const layerId = "groundwater-level";
  const legendEl = document.getElementById("legend-groundwater");

  const visibility = map.getLayoutProperty(layerId, "visibility");

  if (visibility === "visible") {
    map.setLayoutProperty(layerId, "visibility", "none");
    legendEl.style.display = "none";
  } else {
    map.setLayoutProperty(layerId, "visibility", "visible");
    legendEl.style.display = "block";
  }
}

document.getElementById("legend-groundwater").style.display = "none";
