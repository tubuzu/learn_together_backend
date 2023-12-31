import {
  CreateCoinPackageParams,
  UpdateCoinPackageParams,
} from "../dtos/coinPackage.dto.js";
import { CoinPackageModel } from "../models/coinPackage.model.js";

export const createCoinPackageService = async (
  request: CreateCoinPackageParams
) => {
  return await CoinPackageModel.create(request);
};

export const updateCoinPackageService = async (
  packageId: string,
  request: UpdateCoinPackageParams
) => {
  return await CoinPackageModel.findByIdAndUpdate(packageId, request, {
    new: true,
  });
};
