export type AuthErrorKind =
  | 'network'
  | 'auth_invalid'
  | 'token_expired'
  | 'server'
  | 'unknown';

export type AuthErrorClassification = {
  kind: AuthErrorKind;
  status?: number;
  code?: string;
  name?: string;
};

type ErrorLike = {
  code?: unknown;
  message?: unknown;
  name?: unknown;
  status?: unknown;
  __isAuthError?: unknown;
  cause?: unknown;
  originalError?: unknown;
};

const TOKEN_EXPIRED_CODES = new Set([
  'jwt_expired',
  'session_expired',
  'token_expired',
]);

const AUTH_INVALID_CODES = new Set([
  'bad_jwt',
  'invalid_credentials',
  'invalid_grant',
  'invalid_jwt',
  'invalid_token',
  'refresh_token_already_used',
  'refresh_token_not_found',
  'session_not_found',
  'user_not_found',
]);

const NETWORK_CODES = new Set([
  'ERR_ABORTED',
  'ERR_NETWORK',
  'ECONNABORTED',
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENETUNREACH',
  'ENOTFOUND',
]);

const SERVER_STATUS_MIN = 500;
const SERVER_STATUS_MAX = 599;

const asErrorLike = (error: unknown): ErrorLike | null => {
  return typeof error === 'object' && error !== null ? error as ErrorLike : null;
};

const asString = (value: unknown): string | undefined => {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
};

const asStatus = (value: unknown): number | undefined => {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
};

const metadata = (
  kind: AuthErrorKind,
  error: ErrorLike,
): AuthErrorClassification => {
  const status = asStatus(error.status);
  const code = asString(error.code);
  const name = asString(error.name);

  return {
    kind,
    ...(status === undefined ? {} : { status }),
    ...(code === undefined ? {} : { code }),
    ...(name === undefined ? {} : { name }),
  };
};

const hasServerStatus = (status: number | undefined): boolean => {
  return status !== undefined && status >= SERVER_STATUS_MIN && status <= SERVER_STATUS_MAX;
};

const classifyKnownError = (error: ErrorLike): AuthErrorKind | undefined => {
  const name = asString(error.name);
  const code = asString(error.code);
  const status = asStatus(error.status);

  if (name === 'AuthRetryableFetchError') {
    return hasServerStatus(status) ? 'server' : 'network';
  }

  if (name === 'AuthSessionMissingError') {
    return 'auth_invalid';
  }

  if (name === 'AuthInvalidJwtError') {
    return 'auth_invalid';
  }

  if (name === 'AuthInvalidCredentialsError') {
    return 'auth_invalid';
  }

  if (name === 'AuthTokenExpiredError' || name === 'AuthSessionExpiredError') {
    return 'token_expired';
  }

  if (name === 'AuthUnknownError') {
    return hasServerStatus(status) ? 'server' : undefined;
  }

  if (TOKEN_EXPIRED_CODES.has(code ?? '')) {
    return 'token_expired';
  }

  if (AUTH_INVALID_CODES.has(code ?? '')) {
    return 'auth_invalid';
  }

  if (hasServerStatus(status)) {
    return 'server';
  }

  if (status === 401) {
    return 'auth_invalid';
  }

  if (status === 0 || name === 'AbortError' || NETWORK_CODES.has(code ?? '')) {
    return 'network';
  }

  return undefined;
};

const classifyMessageFallback = (error: ErrorLike): AuthErrorKind | undefined => {
  const message = asString(error.message)?.toLowerCase();
  if (!message) return undefined;

  if (
    message.includes('network request failed') ||
    message.includes('failed to fetch') ||
    message.includes('network error') ||
    message.includes('connection refused') ||
    message.includes('connection reset') ||
    message.includes('timed out')
  ) {
    return 'network';
  }

  if (message.includes('invalid login credentials') && asStatus(error.status) !== 403) {
    return 'auth_invalid';
  }

  if (
    message.includes('token expired') ||
    message.includes('jwt expired') ||
    message.includes('session expired')
  ) {
    return 'token_expired';
  }

  return undefined;
};

export const classifyAuthError = (error: unknown): AuthErrorClassification => {
  const errorLike = asErrorLike(error);
  if (!errorLike) return { kind: 'unknown' };

  const knownKind = classifyKnownError(errorLike);
  if (knownKind) return metadata(knownKind, errorLike);

  const cause = asErrorLike(errorLike.cause) ?? asErrorLike(errorLike.originalError);
  const causeKind = cause ? classifyKnownError(cause) : undefined;
  if (cause && causeKind) {
    return metadata(causeKind, {
      ...errorLike,
      status: asStatus(cause.status) ?? asStatus(errorLike.status),
      code: asString(cause.code) ?? asString(errorLike.code),
      name: asString(cause.name) ?? asString(errorLike.name),
    });
  }

  const fallbackKind = classifyMessageFallback(errorLike);
  return fallbackKind ? metadata(fallbackKind, errorLike) : metadata('unknown', errorLike);
};
