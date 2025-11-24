import { Server } from "socket.io";
import http from "http";
import express from "express";

import bcrypt from "bcrypt";

import cookieParser from "cookie-parser";

import fs from "fs";
import path from "path";

import { fileURLToPath } from "url";

import apiRoutes from "./routes/api.js";
import pagesRoutes from "./routes/pages.js";

import serverConfig from "../js/client/serverConfig.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "db", "db.json");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs");

app.use("/media", express.static(path.join(__dirname, "..", "media")));
app.use("/static", express.static(path.join(__dirname, "..", "styles")));
app.use("/static", express.static(path.join(__dirname, "..", "js", "client")));
app.use("/static", express.static(path.join(__dirname, "uploads")));
app.use("/api", apiRoutes);

app.use(pagesRoutes);

app.post("/api/acc-info", async (req, res) => {
  const db = await fs.promises.readFile(dbPath, "utf-8");

  const dbParsed = JSON.parse(db);

  const bodyParsed = req.body;

  const user = dbParsed.users.find((u) => bodyParsed.username === u.username);

  const isTokenValid = await bcrypt.compare(bodyParsed.token, user.token);

  if (isTokenValid) {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(user));
  } else {
    res.writeHead(500);
    res.end(undefined);
  }
});

app.post("/api/acc-info-by-id", async (req, res) => {
  const db = await fs.promises.readFile(dbPath, "utf-8");

  const dbParsed = JSON.parse(db);

  const bodyParsed = req.body;

  const user = dbParsed.users.find((u) => bodyParsed.id == u.id);

  // ONLY PUBLIC INFO

  console.log(user);

  if (user) {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ username: user.username, avatar: user.avatar })); // maybe avatar and other acc info
  } else {
    res.writeHead(500);
    res.end(undefined);
  }
});

app.get("/users/:slug", async (req, res) => {
  const slug = req.params.slug;

  const db = await fs.promises.readFile(dbPath, "utf-8");

  const dbParsed = JSON.parse(db);

  const user = dbParsed.users.find((u) => u.username == slug);

  // checking authorization

  if (!user) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");

    res.render("404", {
      error: `unknown user ${slug}`,
    });
  }

  if (!req.cookies?.token) {
    return;
  }

  if (user) {
    const isTokenValid = await bcrypt.compare(req.cookies?.token, user.token);

    const isMine = dbParsed.users.find(
      (u) => u.username == slug && isTokenValid
    );

    if (isMine) {
      user.mine = true;
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.render("profile", {
      user: user,
    });
  }
});

const server = http.createServer(app);
const io = new Server(server);

server.listen(serverConfig.port, serverConfig.hostname, () => {
  console.log(
    `! socket server is live on ${serverConfig.hostname}:${serverConfig.port} \n`
  );
});

io.on("connection", (socket) => {
  console.log(`! client connected: ${socket.id} \n`);

  socket.on("disconnect", () => {
    console.log(`! client disconnected: ${socket.id} \n`);
  });

  /* message object
    {
        media : string,
        text : string,
        userID : string
    }

    */

  socket.on("send_message", async (message) => {
    console.log(`
    GETTING MESSAGE

    media: ${message.media},
    text: ${message.text},
    token: ${message.token}
            `);

    console.log(message);

    const db = await fs.promises.readFile(dbPath, "utf-8");

    const dbParsed = JSON.parse(db);

    let haveThisUser = false;
    let userID = null;

    for (const user of dbParsed.users) {
      const match = await bcrypt.compare(message.token, user.token);
      if (match) {
        haveThisUser = true;
        userID = user.id; // брать userID только из сервера!
        break;
      }
    }

    if (!haveThisUser) {
      console.log("don't really user");
      return;
    }

    const newMessage = {
      media: message.media,
      text: message.text,
      userID: userID,
    };

    dbParsed.messages.push(newMessage);

    await fs.promises.writeFile(
      dbPath,
      JSON.stringify(dbParsed, null, 2),
      "utf-8"
    );

    socket.broadcast.emit("server_broadcast_send_message", message);
  });
});
