interface LocationParams {
  longitude: any;
  latitude: any;
}

export function createLocation({ longitude, latitude }: LocationParams) {
  return longitude && latitude
    ? {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      }
    : undefined;
}
