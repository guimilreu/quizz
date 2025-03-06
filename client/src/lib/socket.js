import { io } from "socket.io-client";

const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://192.0.0.2:3000';

console.log('URL:', URL);

export const socket = io(URL);
