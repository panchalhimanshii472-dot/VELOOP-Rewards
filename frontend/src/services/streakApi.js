import apiClient from './apiClient';

export async function getStreak() {
  const { data } = await apiClient.get('/daily-streak');
  return data;
}

export async function getStreakStatus() {
  const { data } = await apiClient.get('/daily-streak/status');
  return data;
}

export async function initiateClaim(day) {
  const payload = typeof day === 'number' ? { day } : {};
  const { data } = await apiClient.post('/daily-streak/claim/initiate', payload);
  return data;
}

export async function claimStreak(day, idempotencyKey) {
  const payload = typeof day === 'number' ? { day } : {};
  const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {};
  const { data } = await apiClient.post('/daily-streak/claim', payload, { headers });
  return data;
}

export async function getHistory(page = 1, limit = 20) {
  const { data } = await apiClient.get('/daily-streak/history', {
    params: { page, limit },
  });
  return data;
}

export async function getWallet(page = 1, limit = 20) {
  const { data } = await apiClient.get('/wallet', {
    params: { page, limit },
  });
  return data;
}

export async function getAuditLogs(limit = 25) {
  const { data } = await apiClient.get('/audit-logs', {
    params: { limit },
  });
  return data;
}

