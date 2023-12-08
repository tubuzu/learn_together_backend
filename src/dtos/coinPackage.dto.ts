export interface CreateCoinPackageParams {
  amountOfCoin: number;
  priceInVND: number;
  description?: string;
  discount?: number;
}

export interface UpdateCoinPackageParams extends CreateCoinPackageParams {}
