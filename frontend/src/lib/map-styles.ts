import type { StyleSpecification } from "maplibre-gl";

/**
 * Basemaps.
 *
 * "satellite" is the working surface: you cannot reason about a roof on a
 * vector basemap, so aerial imagery is the default once an address is picked.
 * "context" is the themed vector map, kept for orientation and for the times
 * imagery is stale or cloudy.
 */
export type Basemap = "satellite" | "context";

/** ArcGIS REST tiles are {z}/{y}/{x} — row before column, unlike XYZ. */
const ESRI_IMAGERY =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const ESRI_REFERENCE =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

const ESRI_ATTRIBUTION =
  '<a href="https://www.esri.com/" target="_blank" rel="noreferrer">Esri</a>, Maxar, Earthstar Geographics';

/**
 * Imagery is published to z19. The map allows more than that (see MAX_ZOOM) so
 * a roof can fill the viewport; past z19 MapLibre upscales the z19 tile rather
 * than showing nothing, which is the right trade for panel-level work.
 */
export const IMAGERY_MAX_ZOOM = 19;

/* No symbol layers here, so the style needs no glyphs or sprite. */
export const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    imagery: {
      type: "raster",
      tiles: [ESRI_IMAGERY],
      tileSize: 256,
      maxzoom: IMAGERY_MAX_ZOOM,
      attribution: ESRI_ATTRIBUTION,
    },
    reference: {
      type: "raster",
      tiles: [ESRI_REFERENCE],
      tileSize: 256,
      maxzoom: IMAGERY_MAX_ZOOM,
    },
  },
  layers: [
    { id: "imagery", type: "raster", source: "imagery" },
    {
      id: "reference",
      type: "raster",
      source: "reference",
      // Place names help you find the building, then get out of the way once
      // you are close enough to see the roof itself.
      paint: { "raster-opacity": ["interpolate", ["linear"], ["zoom"], 15, 0.9, 18, 0.25] },
    },
  ],
};

export const CONTEXT_STYLES = {
  light: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
} as const;
