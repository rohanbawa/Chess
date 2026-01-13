import { io } from "socket.io-client";

// Point this to your backend URL
const URL = "http://localhost:4000";

export const socket = io(URL, {
  autoConnect: false,
});