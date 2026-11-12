import apiClient from './apiClient';

export async function loginRequest(credentials) {
  const { data } = await apiClient.post('/auth/login', credentials);
  return data;
}

export async function registerRequest(payload) {
  const { data } = await apiClient.post('/auth/register', payload);
  return data;
}

export async function fetchCurrentUser() {
  const { data } = await apiClient.get('/auth/me');
  return data;
}

export async function updateProfileRequest(payload) {
  const { data } = await apiClient.patch('/auth/profile', payload);
  return data;
}

export async function changePasswordRequest(payload) {
  const { data } = await apiClient.post('/auth/change-password', payload);
  return data;
}
