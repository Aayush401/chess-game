// Important packages
const express = require("express");
const socket = require("socket.io"); // to create a server 
const http = require("http");
const { Chess } = require("chess.js"); // to implement chess rules and other things
const path = require("path"); // creating require path  

const app = express();

// Create server with socket.io
const server = http.createServer(app);
const io = socket(server);

// New chess game instance
const chess = new Chess();
let players = {};

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game" });
});

// Connection between frontend and backend
io.on("connection", function (uniquesocket) {
    console.log("A player connected");

    // Assign player roles
    if (!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "b");
    } else {
        uniquesocket.emit("spectatorRole");
    }

    // Handle player disconnect
    uniquesocket.on("disconnect", function () {
        console.log("A player disconnected");
        if (uniquesocket.id === players.white) {
            delete players.white;
        } else if (uniquesocket.id === players.black) {
            delete players.black;
        }
    });

    // Handle player moves
    uniquesocket.on("move", (move) => {
        try {
            // Ensure it's the correct player's turn
            if (chess.turn() === "w" && uniquesocket.id !== players.white) return;
            if (chess.turn() === "b" && uniquesocket.id !== players.black) return;

            const result = chess.move(move);
            if (result) {
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                console.log("Invalid move: ", move);
                uniquesocket.emit("invalidMove", move);
            }
        } catch (err) {
            console.log("Error:", err);
            uniquesocket.emit("invalidMove", move);
        }
    });
});

// Start the server on port 3000
server.listen(3000, function () {
    console.log("Listening on port 3000");
});
