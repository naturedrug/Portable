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

import serverConfig from "./client/js/serverConfig.js";
import { nanoid } from "nanoid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "db", "db.json");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs");

app.use("/media", express.static(path.join(__dirname, "client", "media")));
app.use("/static", express.static(path.join(__dirname, "client", "styles")));
app.use("/static", express.static(path.join(__dirname, "client", "js")));
app.use("/static", express.static(path.join(__dirname, "uploads")));
app.use("/api", apiRoutes);

app.use(pagesRoutes);

app.post("/api/acc-info", async (req, res) => {
  const db = await fs.promises.readFile(dbPath, "utf-8");

  const dbParsed = JSON.parse(db);

  const bodyParsed = req.body

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


  if (user) {
    console.log("acc-info-by-id is ok")
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ username: user.username, avatar: user.avatar })); // maybe avatar and other acc info
  } else {
    console.log("acc-info-by-id is not ok")
    res.writeHead(500);
    res.end(undefined);
  }
});

app.get("/users/:slug", async (req, res) => {
  const slug = req.params.slug;

  try {
    const db = await fs.promises.readFile(dbPath, "utf-8");
    const dbParsed = JSON.parse(db);

    const user = dbParsed.users.find((u) => u.username == slug);


    if (!user) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.render("404", {
        error: `unknown user ${slug}`,
      });
    }


    let isMine = false;


    if (req.cookies?.token) {
      const isTokenValid = await bcrypt.compare(req.cookies.token, user.token);
      isMine = isTokenValid;
    }


    const userWithMineFlag = {
      ...user,
      mine: isMine
    };

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.render("profile", {
      user: userWithMineFlag,
    });

  } catch (error) {
    console.error("Error loading user profile:", error);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.render("500", {
      error: "Internal server error",
    });
  }
});

app.get("/@:channel", async (req, res) => {
  const channelslug = req.params.channel

  const database = await fs.promises.readFile(dbPath, 'utf-8')
  const dbParsed = JSON.parse(database)

  let channelFromDB = dbParsed.channels.find((c) => c.name === channelslug)




  if (channelFromDB) {
    res.cookie("channelid", channelFromDB.channelID)
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.render("channel", {
      channel: channelFromDB,
    });
  } else {
    res.render("404", {
      error: `unknown channel ${channelslug}`
    })
  }
})

app.get("/invite=:inviteCode", async (req, res) => {
  const inviteCode = req.params.inviteCode

  if (!req.cookies.token) { console.log("don't have token for inviting"); return }

  const db = await fs.promises.readFile(dbPath, 'utf-8')
  const dbParsed = JSON.parse(db)

  const userWithThisCode = dbParsed.users.find((u) => u.invite == inviteCode)

  if (!userWithThisCode) {
    res.render("404", {
      error: "don't have this invite"
    })

    return
  }

  let findedUser;

  for (const user of dbParsed.users) {
    const valid = await bcrypt.compare(req.cookies.token, user.token)

    if (valid) {
      findedUser = user
    }

  }

  if (!findedUser) { console.log("don't have user for this token"); return }

  const userInDb = dbParsed.users.find((u) => u.id == findedUser.id)

  if (!userInDb.pms) {
    userInDb.pms = []
  }

  const idForPM = nanoid(25)

  userInDb.pms.push(idForPM)
  userWithThisCode.pms.push(idForPM)

  if (!dbParsed.pms) {
    dbParsed.pms = []
  }

  const newPM = {
    id: idForPM,
    members: [userWithThisCode.id, findedUser.id]
  }

  dbParsed.pms.push(newPM)

  await fs.promises.writeFile(dbPath, JSON.stringify(dbParsed, null, 2), 'utf-8')
  res.redirect("/chat")

})

app.use((req, res, next) => {


  console.log(`UNKNOWN ${req.path}`)

  res.render("404", {
    error: `unknown page ${req.path}`
  })

})

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

  socket.on("change-room", async (token, roomId) => {
    if (!token || !roomId) {
      console.log("change-room listener, don't have required data")

      return
    }

    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.leave(room);
      }
    }

    const database = await fs.promises.readFile(dbPath, 'utf-8')
    const dbParsed = JSON.parse(database)

    let haveThisUser = false;
    let userID = null;

    for (const user of dbParsed.users) {
      const match = await bcrypt.compare(token, user.token);
      if (match) {
        haveThisUser = true;
        userID = user.id;
        break;
      }
    }

    if (!haveThisUser) {
      console.log("don't really user");
      return;
    }

    socket.join(roomId)

  })


  socket.on("send_message", async (message, roomId) => {
    // console.log(`
    // GETTING MESSAGE

    // media: ${message.media},
    // text: ${message.text},
    // token: ${message.token}
    //         `);

    // console.log(message);

    const db = await fs.promises.readFile(dbPath, "utf-8");

    const dbParsed = JSON.parse(db);

    let haveThisUser = false;
    let userID = null;
    let sender;

    for (const user of dbParsed.users) {
      const match = await bcrypt.compare(message.token, user.token);
      if (match) {
        haveThisUser = true;
        userID = user.id;
        sender = user;
        break;
      }
    }

    if (!haveThisUser) {
      console.log("don't really user");
      return;
    }

    let isUserHaveThisChannel = false;

    if (sender.channels) {
      for (const channel of sender.channels) {
        if (channel.channelID == roomId) {
          isUserHaveThisChannel = true
        }
      }
    }


    let isUserHaveThisPM = false;

    if (sender.pms) {
      for (const PM of dbParsed.pms) {

        if (PM.members.includes(sender.id)) {
  
          isUserHaveThisPM = true;
        }
      }
    }


    if (!isUserHaveThisChannel && !isUserHaveThisPM) {
      console.log("user don't have this channel or PM (server listener)")
      return
    }

    // sending below

    const mediaID = nanoid(25)
    if (message.media) {
      const media = Buffer.from(message.media)


      await fs.promises.writeFile(path.join(__dirname, "uploads", `${mediaID}.jpg`), media)
    }


    const newMessage = {
      media: (message.media) ? `/static/${mediaID}.jpg` : undefined,
      text: message.text,
      userID: userID
    };

    const channelFromDB = dbParsed.channels.find((c) => roomId === c.channelID)

    if (!channelFromDB) {
      const PMFromDB = dbParsed.pms.find((pm) => pm.id === roomId)

      if (!PMFromDB.messages) {
        PMFromDB.messages = []
      }


      PMFromDB.messages.push(newMessage);

      await fs.promises.writeFile(
        dbPath,
        JSON.stringify(dbParsed, null, 2),
        "utf-8"
      );

      console.log(`TO ${roomId}`)

      newMessage.room = roomId

      socket.to(roomId).emit("server_send_message", newMessage);
    } else {

      if (!channelFromDB.messages) {
        channelFromDB.messages = []
      }

      channelFromDB.messages.push(newMessage);

      await fs.promises.writeFile(
        dbPath,
        JSON.stringify(dbParsed, null, 2),
        "utf-8"
      );

      console.log(`TO ${roomId}`)

      newMessage.room = roomId

      socket.to(roomId).emit("server_send_message", newMessage);
    }

  });
});
