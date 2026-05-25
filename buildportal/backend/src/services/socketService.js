export function setupSocketIO(io) {
  io.on('connection', (socket) => {
    socket.on('subscribe:build', (buildId) => {
      socket.join(`build:${buildId}`);
    });
    socket.on('unsubscribe:build', (buildId) => {
      socket.leave(`build:${buildId}`);
    });
    socket.on('disconnect', () => {});
  });
}