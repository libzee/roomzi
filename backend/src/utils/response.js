export const successResponse = (data, message = "Success") => ({
  success: true,
  message,
  data,
});

export const errorResponse = (error, statusCode = 500) => ({
  success: false,
  error: error.message || "Something went wrong",
  statusCode,
});

export const paginatedResponse = (data, page, limit, total) => ({
  success: true,
  data,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  },
});
