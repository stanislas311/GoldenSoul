const { io } = require("socket.io-client");
const socket = io("http://localhost:5000", { forceNew: true });
socket.on("connect", () => {
  console.log("Connected");
  socket.emit("rejoindre-room", "test-room");
  setTimeout(() => process.exit(0), 1000);
});
socket.on("connect_error", (err) => console.error(err));
