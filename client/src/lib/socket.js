import { io } from "socket.io-client";

const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://192.168.0.108:3000';

console.log('URL:', URL);

export const socket = io(URL);
