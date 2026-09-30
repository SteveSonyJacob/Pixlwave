/** Google Maps URL for the exact published screen coordinates. */
export function googleMapsLocationUrl(latitude: number, longitude: number) {
  const url = new URL("https://www.google.com/maps/search/");
  url.searchParams.set("api", "1");
  url.searchParams.set("query", `${latitude},${longitude}`);
  return url.toString();
}
