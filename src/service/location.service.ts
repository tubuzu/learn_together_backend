import { CreateLocationParams } from "../dtos/location.dto.js";

export function createLocation({ longitude, latitude }: CreateLocationParams) {
  return longitude && latitude
    ? {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      }
    : undefined;
}
