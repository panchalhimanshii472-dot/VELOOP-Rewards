const AppError = require('../utils/appError');

function notFoundHandler(_req, res) {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: 'Requested endpoint was not found.',
    serverTime: new Date().toISOString(),
  });
}

/**
 * Central Express error handler. Never leaks MongoServerError, CastError,
 * AxiosError, or internal stack traces to clients.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  const serverTime = new Date().toISOString();

  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      code: 'INVALID_JSON',
      message: 'Malformed JSON request body.',
      serverTime,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      ...(err.meta ? { details: err.meta } : {}),
      serverTime,
    });
  }

  // Mongo duplicate key error (e.g. concurrent claim hitting unique index)
  if (err && (err.code === 11000 || err.name === 'MongoServerError')) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        code: 'DUPLICATE_REQUEST',
        message: 'This reward has already been claimed or is currently being processed.',
        serverTime,
      });
    }
    return res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: 'Unable to process your request. Please try again.',
      serverTime,
    });
  }

  if (err && err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      code: 'INVALID_INPUT',
      message: 'Invalid request parameter format.',
      serverTime,
    });
  }

  if (err && err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Please check your input and try again.',
      serverTime,
    });
  }

  return res.status(500).json({
    success: false,
    code: 'SERVER_ERROR',
    message: 'Unable to process your reward. Please try again.',
    serverTime,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};

