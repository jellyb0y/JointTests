import path from 'path';

export const WSS_PORT = 4433;
export const SESSION_TIMEOUT = 5000;
export const MAX_SESSIONS = 30;

export const SERVER_SECRET = 'topSecret';
export const SSL_KEY_PATH = path.resolve(__dirname, '../key.pem');
export const SSL_CERT_PATH = path.resolve(__dirname, '../cert.pem');
