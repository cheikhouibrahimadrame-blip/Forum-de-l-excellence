export const getReadableApiError = (err: any, fallback: string) => {
  const status = err?.status ?? err?.response?.status;
  const backendMessage =
    err?.data?.error ||
    err?.data?.message ||
    err?.response?.data?.error ||
    err?.response?.data?.message;
  const message = String(err?.message || '').toLowerCase();
  const code = err?.code;
  const name = err?.name;

  if (name === 'AbortError' || name === 'CanceledError' || code === 'ERR_CANCELED' || message === 'canceled') {
    return '';
  }

  if (status === 401) {
    return 'Session expiree. Veuillez vous reconnecter.';
  }

  if (
    message.includes('refresh') ||
    message.includes('no token available after refresh') ||
    message.includes('token de rafraichissement')
  ) {
    return 'Session expiree. Veuillez vous reconnecter.';
  }

  if (status === 403) {
    return 'Acces refuse pour cette action.';
  }

  return backendMessage || err?.message || fallback;
};
