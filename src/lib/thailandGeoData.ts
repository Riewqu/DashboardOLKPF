/**
 * Thailand GeoJSON Data Loader
 *
 * This file provides access to the real Thailand GeoJSON with accurate province boundaries.
 * Source: https://raw.githubusercontent.com/apisit/thailand.json/master/thailand.json
 * License: Open Source (MIT/Public Domain)
 *
 * The GeoJSON is served from /thailand.json in the public folder (1.2 MB).
 * Province names in the GeoJSON are in English.
 * Use provinceNameMap to convert English names to Thai names for data lookup.
 */

export type ThailandGeoJSON = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: {
      name: string; // English province name (e.g., "Mae Hong Son", "Bangkok")
    };
    geometry: {
      type: "Polygon" | "MultiPolygon";
      coordinates: number[][][] | number[][][][];
    };
  }>;
};

/**
 * Load Thailand GeoJSON from public folder
 * This function should be called client-side
 *
 * @returns Promise<ThailandGeoJSON | null>
 */
export async function loadThailandGeoJSON(): Promise<ThailandGeoJSON | null> {
  try {
    const response = await fetch('/thailand.json');
    if (!response.ok) {
      console.error('Failed to load thailand.json:', response.statusText);
      return null;
    }
    const data = await response.json();
    return data as ThailandGeoJSON;
  } catch (error) {
    console.error('Error loading thailand.json:', error);
    return null;
  }
}
