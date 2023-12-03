export const successResponse = ({ data, message }: SuccessResponseParams) => ({
  success: true,
  ...(data && { data }),
  ...(message && { message }),
});

export const errorResponse = ({ message }: ErrorResponseParams) => ({
  success: false,
  message,
});

// Tạo một function để lấy trang thứ page trong items, với size là perPage
export const getPage = (items: Array<any>, page: number, perPage: number) => {
  // Kiểm tra các tham số đầu vào
  if (!Array.isArray(items)) {
    throw new Error("Items must be an array");
  }
  if (!Number.isInteger(page) || page < 1) {
    throw new Error("Page must be a positive integer");
  }
  if (!Number.isInteger(perPage) || perPage < 1) {
    throw new Error("PerPage must be a positive integer");
  }

  // Tính toán chỉ số bắt đầu và kết thúc của trang
  const startIndex = (page - 1) * perPage;
  const endIndex = page * perPage;

  // Trả về một mảng con của items theo chỉ số bắt đầu và kết thúc
  return items.slice(startIndex, endIndex);
};

export const pageResponse = (
  items: Array<any>,
  page: number,
  perPage: number,
  useGetPage: boolean = false
) => {
  page = Math.max(page, 1);
  perPage = Math.max(perPage, 1);
  if (useGetPage) items = getPage(items, page, perPage);
  return {
    items,
    count: items.length,
    currentPage: page, // trang hiện tại
    totalPages: Math.ceil(items.length / perPage), // tổng số trang
  };
};

interface SuccessResponseParams {
  data?: any;
  message?: string;
}

interface ErrorResponseParams {
  message: string;
}
