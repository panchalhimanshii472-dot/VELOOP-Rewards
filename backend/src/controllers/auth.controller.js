const asyncHandler = require('../utils/asyncHandler');
const {
  validateRegisterPayload,
  validateLoginPayload,
  validateUpdateProfilePayload,
  validateChangePasswordPayload,
} = require('../validators/authValidator');
const authService = require('../services/auth.service');

const getClientMeta = (req) => ({
  ipAddress:
    (req.headers['x-forwarded-for'] && String(req.headers['x-forwarded-for']).split(',')[0].trim()) ||
    req.ip ||
    null,
  userAgent: req.headers['user-agent'] || null,
});

const register = asyncHandler(async (req, res) => {
  const payload = validateRegisterPayload(req.body);
  const data = await authService.registerUser(payload, getClientMeta(req));

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    serverTime: new Date().toISOString(),
    ...data,
  });
});

const login = asyncHandler(async (req, res) => {
  const payload = validateLoginPayload(req.body);
  const data = await authService.loginUser(payload, getClientMeta(req));

  res.status(200).json({
    success: true,
    message: 'Logged in successfully.',
    serverTime: new Date().toISOString(),
    ...data,
  });
});

const me = asyncHandler(async (req, res) => {
  const data = await authService.getCurrentUserProfile(req.user.id);

  res.status(200).json({
    success: true,
    serverTime: new Date().toISOString(),
    ...data,
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const payload = validateUpdateProfilePayload(req.body);
  const data = await authService.updateUserProfile(req.user.id, payload, getClientMeta(req));

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    serverTime: new Date().toISOString(),
    ...data,
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const payload = validateChangePasswordPayload(req.body);
  const data = await authService.changeUserPassword(req.user.id, payload, getClientMeta(req));

  res.status(200).json({
    success: true,
    serverTime: new Date().toISOString(),
    ...data,
  });
});

module.exports = {
  register,
  login,
  me,
  updateProfile,
  changePassword,
};

