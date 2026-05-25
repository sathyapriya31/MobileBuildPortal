import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(window.location.origin, { autoConnect: false, transports: ['websocket'] });
  }
  return socket;
}

export function connectSocket(token) {
  const s = getSocket();
  s.auth = { token };
  s.connect();
  return s;
}

export function subscribeToBuild(buildId, callbacks) {
  const s = getSocket();
  s.emit('subscribe:build', buildId);
  if (callbacks.onStatus) s.on('build:status', callbacks.onStatus);
  if (callbacks.onLog) s.on('build:log', callbacks.onLog);
  if (callbacks.onComplete) s.on('build:complete', callbacks.onComplete);
}

export function unsubscribeFromBuild(buildId) {
  const s = getSocket();
  s.emit('unsubscribe:build', buildId);
  s.off('build:status');
  s.off('build:log');
  s.off('build:complete');
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}