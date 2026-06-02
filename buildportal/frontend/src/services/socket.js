import { io } from 'socket.io-client';
import { updateBuildStatus, addBuildLog } from '../store/slices/buildsSlice.js';

let socket = null;
const activeSubscriptions = new Set();

export function getSocket() {
  if (!socket) {
    socket = io(window.location.origin, { autoConnect: false, transports: ['websocket'] });
  }
  return socket;
}

export function connectSocket(token, dispatch) {
  const s = getSocket();
  s.auth = { token };

  // Setup connection/reconnection event
  s.off('connect');
  s.on('connect', () => {
    console.log('🔌 Socket connected. Resubscribing to active builds:', Array.from(activeSubscriptions));
    activeSubscriptions.forEach((buildId) => {
      s.emit('subscribe:build', buildId);
    });
  });

  // Setup global event listeners to update Redux store directly
  s.off('build:status');
  s.off('build:log');
  s.off('build:complete');

  s.on('build:status', (data) => {
    if (dispatch) dispatch(updateBuildStatus(data));
  });

  s.on('build:log', (data) => {
    if (dispatch) dispatch(addBuildLog({ buildId: data.buildId, ...data }));
  });

  s.on('build:complete', (data) => {
    if (dispatch) dispatch(updateBuildStatus(data));
  });

  s.connect();
  return s;
}

export function subscribeToBuild(buildId) {
  const s = getSocket();
  activeSubscriptions.add(buildId);
  if (s.connected) {
    s.emit('subscribe:build', buildId);
  }
}

export function unsubscribeFromBuild(buildId) {
  const s = getSocket();
  activeSubscriptions.delete(buildId);
  if (s.connected) {
    s.emit('unsubscribe:build', buildId);
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  activeSubscriptions.clear();
}