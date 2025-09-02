export function generateMapUrl(
  x: number,
  z: number,
  waypointName: string,
): string {
  const mapOptions = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          popupText: waypointName,
          iconName: "waypoint",
          turnLayerOff: ["ruinedLayer", "treesLayer", "templesLayer"],
        },
        geometry: {
          type: "Point",
          coordinates: [x, z],
        },
      },
    ],
  };

  // this should be urlencoded but bitcraftmap doesn't seem to currently handle that correctly
  const encodedMapOptions = JSON.stringify(mapOptions).replaceAll(" ", "%20");
  return `https://bitcraftmap.com/#${encodedMapOptions}`;
}
