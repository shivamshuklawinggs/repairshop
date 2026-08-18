import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { FRONTEND_URL } from 'config';

let io: SocketIOServer | null = null;

export const initializeSocketIO = (httpServer: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  console.log('✅ Socket.IO initialized');
  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Call initializeSocketIO first.');
  }
  return io;
};
export default { initializeSocketIO, getIO };

