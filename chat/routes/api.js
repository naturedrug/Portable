import express from "express";

import fs from "fs";
import { nanoid } from "nanoid";
import bcrypt from "bcrypt";
import path from "path";
import { fileURLToPath } from "url";

import multer from "multer";

import iconv from "iconv-lite";

import serverConfig from "../../js/client/serverConfig.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixCyrillic(corrupted) {
  return iconv.decode(Buffer.from(corrupted, "latin1"), "utf8");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },

  filename: (req, file, cb) => {
    const correctName = iconv.decode(
      Buffer.from(file.originalname, "latin1"),
      "utf8"
    );

    cb(null, correctName);
  },
});

const upload = multer({ storage: storage });

const dbPath = path.join(__dirname, "..", "db", "db.json");

const router = express.Router();

router.post("/auth", async (req, res) => {
  try {
    const data = req.body;
    const database = await fs.promises.readFile(dbPath, "utf-8");
    const databaseParsed = JSON.parse(database);

    const user = databaseParsed.users.find((u) => u.username === data.username);

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (isPasswordValid) {
      const refreshedToken = nanoid(14);
      const refreshedHashedToken = await bcrypt.hash(refreshedToken, 12);

      user.token = refreshedHashedToken;

      res.cookie("token", refreshedToken);
      res.cookie("username", data.username);

      await fs.promises.writeFile(
        dbPath,
        JSON.stringify(databaseParsed, null, 2)
      );

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          token: refreshedToken,
        })
      );
    } else {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
        })
      );
    }
  } catch (error) {
    console.error("Auth handler error:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: false }));
  }
});

router.post("/reg", async (req, res) => {
  try {
    const data = req.body;
    const database = await fs.promises.readFile(dbPath, "utf-8");
    const databaseParsed = JSON.parse(database);

    const user = databaseParsed.users.find(
      (u) => u.username === data.username || u.password === data.password
    );

    if (user) {
      console.error("database already has user with same password or login");
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
        })
      );
    } else {
      const hashedPassword = await bcrypt.hash(data.password, 12);

      const token = nanoid(21);
      const hashedToken = await bcrypt.hash(token, 12);

      res.cookie("token", token);
      res.cookie("username", data.username);

      const newUser = {
        username: data.username,
        password: hashedPassword,
        token: hashedToken,
        avatar: `http://${serverConfig.hostname}:${serverConfig.port}/media/people.png`,
        id: nanoid(20),
      };

      databaseParsed.users.push(newUser);

      const stringifyDB = JSON.stringify(databaseParsed, null, 2);

      await fs.promises.writeFile(dbPath, stringifyDB, "utf8");

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
        })
      );
    }
  } catch (error) {
    console.error("Reg handler error:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: false }));
  }
});

router.post("/auth-token", async (req, res) => {
  if (!req.body.token || !req.body.username) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        error: "dont have required data",
      })
    );
  }

  const database = await fs.promises.readFile(dbPath, "utf-8");

  const dbParsed = JSON.parse(database);

  const user = dbParsed.users.find((u) => req.body.username === u.username);

  if (!user) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end("unknown user");
  }

  const isTokenValid = await bcrypt.compare(req.body.token, user.token);

  if (isTokenValid) {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
      })
    );
  } else {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
      })
    );
  }
});

router.post(
  "/change-account-data",
  upload.single("newAvatar"),
  async (req, res) => {
    if (!req.body.token || !req.body.username) {
      res.end("have no required data");
    }

    const database = await fs.promises.readFile(dbPath, "utf-8");
    const dbParsed = JSON.parse(database);

    /* MUST BE FILLED

  token, required
  username, required
  newUsername,
  newPassword,
  newBio,
  newAvatar

  */

    const user = dbParsed.users.find(
      (u) => decodeURI(req.body.username) === decodeURI(u.username)
    );

    if (!user) {
      console.log("change-account-data: don't have user");
      return;
    }

    const isTokenValid = await bcrypt.compare(req.body.token, user.token);

    if (!isTokenValid) {
      res.end("invalid token");
    }

    if (
      req.body.newUsername &&
      user.avatar !=
        `http://${serverConfig.hostname}:${serverConfig.port}/media/people.png`
    ) {
      // rename avatar image file when username is changed

      const oldAvatar = user.avatar.slice(8); // getting file name

      const oldAvatarPath = path.join(__dirname, "..", "uploads", oldAvatar);
      const newAvatarPath = path.join(
        __dirname,
        "..",
        "uploads",
        `${req.body.newUsername}.jpg`
      );

      await fs.promises.rename(oldAvatarPath, newAvatarPath);
      user.avatar = `/static/${req.body.newUsername}.jpg`;
    }

    user.username = req.body.newUsername || "<blank>";
    user.password = req.body.newPassword || user.password;
    user.bio = req.body.newBio;
    ``;

    if (req.file) {
      user.avatar = `/static/${fixCyrillic(req.file.originalname)}`;
    }

    await fs.promises.writeFile(
      dbPath,
      JSON.stringify(dbParsed, null, 2),
      "utf-8"
    );

    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
      })
    );
  }
);

router.post("new-channel", async (req, res) => {
  const database = await fs.promises.readFile(dbPath, "utf-8");
  const dbParsed = JSON.parse(database);

  const body = req.body;

  /*
  req.body:

  token,
  channelName,
  avatar,
  desc,


  */

  if (!body.token || !body.channelName) {
    console.log("don't have token or channel name");
    res.writeHead(500, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        error: `statusCode: 500, don't have enough data`,
      })
    );
  }

  if (!dbParsed.channels) {
    dbParsed.channels = [];
  }

  let haveThisUser = false;
  let userID = null;

  for (const user of dbParsed.users) {
    const match = await bcrypt.compare(body.token, user.token);
    if (match) {
      haveThisUser = true;
      userID = user.id;
      break;
    }
  }

  if (!haveThisUser) {
    console.log("don't have this user");
    res.writeHead(500, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        error: `statusCode: 500, don't have enough data`,
      })
    );
  }

  const newChannel = {
    name: body.channelName,
    author: userID,
    avatar: body.avatar,
    channelID: nanoid(21),
  };

  dbParsed.channels.push(newChannel);

  await fs.promises.writeFile(
    dbPath,
    JSON.stringify(dbParsed, null, 2),
    "utf-8"
  );
});

export default router;
