const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();

const server = http.createServer(app); //making http server and linking with express
const io = socket(server); //passing the server to socket

const chess = new Chess();
let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs"); //setting up the viewing engine as ejs
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index"), { title: "Chess Game" };
});

io.on("connection", function (uniquesocket) {
  console.log("connected");
  if (!players.white) {
    players.white = uniquesocket.id;
    uniquesocket.emit("playerRole", "w");
    console.log("player=white");
  } else if (!players.black) {
    players.black = uniquesocket.id;
    uniquesocket.emit("playerRole", "b");
    console.log("player=black");
  } else {
    uniquesocket.emit("spectatorRole");
    console.log("spectator");
  }

  uniquesocket.on("disconnect", function () {
    if (uniquesocket.id === players.white) {
      delete players.white;
    } else if (uniquesocket.id === players.black) {
      delete players.black;
    }
  });

  uniquesocket.on("move", (move) => {
    try {
      if (chess.turn() === "w" && uniquesocket.id !== players.white) return;
      if (chess.turn() === "b" && uniquesocket.id !== players.black) return;

      const result = chess.move(move);
      if (result) {
        currentPlayer = chess.turn();
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        console.log("Inavlid move:", move);
        uniquesocket.emit("Inavlid Move : ", move);
      }
    } catch (error) {
      console.log(error);
      uniquesocket.emit("Inavlid Move : ", move);
    }
  });
});

server.listen(3000, function () {
  console.log("listening on port 3000");
});
