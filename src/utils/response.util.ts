export const successResponse = ({ data, message }: SuccessResponseParams) => ({
  success: true,
  ...(data && { data }),
  ...(message && { message }),
});

export const errorResponse = ({ message }: ErrorResponseParams) => ({
  success: false,
  message,
});

interface SuccessResponseParams {
  data?: any;
  message?: string;
}

interface ErrorResponseParams {
  message: string;
}
