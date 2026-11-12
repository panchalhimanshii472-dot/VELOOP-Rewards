const AppError = require('../utils/appError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegisterPayload(body = {}) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (name.length < 2 || name.length > 80) {
    throw new AppError('Name must be between 2 and 80 characters.', 400, 'VALIDATION_ERROR');
  }
  if (!EMAIL_REGEX.test(email)) {
    throw new AppError('Please provide a valid email address.', 400, 'VALIDATION_ERROR');
  }
  if (password.length < 6 || password.length > 100) {
    throw new AppError('Password must be at least 6 characters long.', 400, 'VALIDATION_ERROR');
  }

  return { name, email, password };
}

function validateLoginPayload(body = {}) {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!EMAIL_REGEX.test(email) || !password) {
    throw new AppError('Email and password are required.', 400, 'VALIDATION_ERROR');
  }

  return { email, password };
}

function validateUpdateProfilePayload(body = {}) {
  const forbidden = ['role', 'isActive', 'email', 'userId', 'veBalance', 'streak'];
  for (const field of forbidden) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      throw new AppError(
        `Field '${field}' cannot be modified via profile update.`,
        400,
        'FORBIDDEN_PROFILE_FIELD'
      );
    }
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length < 2 || name.length > 80) {
    throw new AppError('Name must be between 2 and 80 characters.', 400, 'VALIDATION_ERROR');
  }

  return { name };
}

function validateChangePasswordPayload(body = {}) {
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

  if (!currentPassword) {
    throw new AppError('Current password is required.', 400, 'VALIDATION_ERROR');
  }
  if (newPassword.length < 6 || newPassword.length > 100) {
    throw new AppError('New password must be at least 6 characters long.', 400, 'VALIDATION_ERROR');
  }
  if (currentPassword === newPassword) {
    throw new AppError('New password must be different from your current password.', 400, 'VALIDATION_ERROR');
  }

  return { currentPassword, newPassword };
}

module.exports = {
  validateRegisterPayload,
  validateLoginPayload,
  validateUpdateProfilePayload,
  validateChangePasswordPayload,
};

