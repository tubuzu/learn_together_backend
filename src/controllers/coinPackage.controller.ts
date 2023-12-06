import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { CoinPackageModel } from "../models/coinPackage.model.js";
import { successResponse, pageResponse } from "../utils/response.util.js";
import {
  createCoinPackageService,
  updateCoinPackageService,
} from "../service/coinPackage.service.js";

export const getAllCoinPackage = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.perPage as string) || 10;

  const packages = await CoinPackageModel.find({})
    .sort({ created_at: -1 })
    .skip((page - 1) * perPage)
    .limit(perPage);

  return res
    .status(StatusCodes.OK)
    .json(successResponse({ data: pageResponse(packages, page, perPage) }));
};

export const createCoinPackage = async (req: Request, res: Response) => {
  const { amountOfCoin, priceInVND, description, discount } = req.body;
  const coinPackage = await createCoinPackageService({
    amountOfCoin,
    priceInVND,
    description,
    discount,
  });
  return res
    .status(StatusCodes.OK)
    .json(successResponse({ data: coinPackage }));
};

export const updateCoinPackage = async (req: Request, res: Response) => {
  const { packageId } = req.params;
  const params = req.body;
  const coinPackage = await updateCoinPackageService(packageId, params);
  return res
    .status(StatusCodes.OK)
    .json(successResponse({ data: coinPackage }));
};
