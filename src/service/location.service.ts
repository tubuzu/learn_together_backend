import { CreateLocationParams } from "../interfaces/location.interface.js";

export function createLocation({ longitude, latitude }: CreateLocationParams) {
  return longitude && latitude
    ? {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      }
    : undefined;
}
