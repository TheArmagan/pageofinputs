const express = require("express");
const app = express();
const httpServer = require("http").createServer(app);
const io = new (require("socket.io").Server)();
const path = require("path");
io.listen(httpServer);
httpServer.listen(8080);

app.use(express.static(path.resolve(__dirname, "static")));

const charBuffers = new Map();

io.on("connect", (socket) => {
  console.log("world", socket.handshake.query.w)
  let world = socket.handshake.query.w || "main";

  let worldRoom = `world:${world}`;
  if (!charBuffers.has(world)) charBuffers.set(world, new Map());
  
  socket.join(worldRoom);
  socket.on("char", (xy, cc) => {
    if (!Array.isArray(xy)) return;
    let [x, y] = xy;
    if (!Array.isArray(cc)) return;
    let [char, color] = cc;
    x = Math.max(x, 1);
    y = Math.max(y, 1);
    char = String(char || " ").slice(0, 1);
    color = isNaN(color) ? 0xffffff : Math.min(Math.max(color, 0), 0xffffff);
    socket.to(worldRoom).emit("char", [x, y], [char, color]);
    console.log(["char", x, y, char, color])
    if (char.trim().length == 0) {
      charBuffers.get(world).delete(`${x}_${y}`)
    } else {
      charBuffers.get(world).set(`${x}_${y}`, [char, color])
    }
  });
  socket.on("getCharBuffer", (cb) => {
    let buf = Array.from(charBuffers.get(world).entries());
    console.log(["getCharBuffer", buf]);
    cb(buf);
  })
});

