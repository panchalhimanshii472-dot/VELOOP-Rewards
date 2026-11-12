class AppError extends Error {
  /**
   * @param {string} message User-safe error message
   * @param {number} statusCode HTTP status code
   * @param {string} code Machine-readable error code
   * @param {object} [meta] Safe extra response payload (no internal stack/DB traces)
   */
  constructor(message, statusCode = 400, code = 'BAD_REQUEST', meta = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.meta = meta;
    this.isOperational = true;
  }
}

module.exports = AppError;

