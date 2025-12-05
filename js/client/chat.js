import serverConfig from "./serverConfig.js";

const socket = io(`http://${serverConfig.hostname}:${serverConfig.port}`);

const account = JSON.parse(localStorage.getItem("account"));

window.onload = async () => {
  if (!localStorage.getItem("account")) {
    window.location.href = "/auth";
  }
};

let isReallyUser = await fetch(
  `http://${serverConfig.hostname}:${serverConfig.port}/api/auth-token`,
  {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      username: account.username,
      token: account.token,
    }),
  }
);

isReallyUser = await isReallyUser.json();

if (!isReallyUser.success) {
  window.location.href = "/auth";
}

let isConnected = false;

socket.on("connect", () => {
  isConnected = true;
  console.log("! client connected: " + socket.id);
});

socket.on("server_broadcast_send_message", (message) => {

  SocketListeners.getMessage(
    message.userID,
    undefined,
    message.text,
    message.media
  );
});

const button = document.querySelector("button");
const input = document.querySelector(".messageInput");
const content = document.querySelector(".content");

class DataSender {
  static async sendMessage(text, mediaDataURL) {
    if (!text) return;

    input.value = "";

    createMessage(
      account.username,
      `http://${serverConfig.hostname}:${serverConfig.port}/static/${encodeURI(account.username)}.jpg`,
      undefined,
      text,
      true
    );

      socket.emit("send_message", {
        media: mediaDataURL,
        text: text,
        token: account.token,
      });
  }
}

class SocketListeners {
  static async getMessage(senderID, group, text, mediaDataURL) {
    console.log(senderID)

    let user = await fetch(
      `http://${serverConfig.hostname}:${serverConfig.port}/api/acc-info-by-id`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: senderID,
        }),
      }
    );

    user = await user.json();

    createMessage(user.username, user.avatar, mediaDataURL, text, false);
  }
}

function createMessage(author, avatar, media, text, my) {
  const message = document.createElement("div");
  message.classList.add("message");

  if (my) {
    message.classList.add("my");
  }

  const authorUsername = document.createElement("a");

  authorUsername.textContent = author;
  authorUsername.classList.add("username");
  authorUsername.href = `/users/${author}`;

  const messageText = document.createElement("p");
  messageText.textContent = text;

  if (media) {
    const messageMedia = document.createElement("img");
    messageMedia.classList.add("messageMedia");
    messageMedia.src = media;
    message.appendChild(messageMedia);
  }

  const userAvatar = document.createElement("img");
  userAvatar.classList.add("avatar");
  userAvatar.src = avatar;

  message.appendChild(userAvatar);

  const container = document.createElement("div")

  container.classList.add("messageContainer")

  content.appendChild(message);
  message.appendChild(container)
  container.appendChild(authorUsername);
  container.appendChild(messageText);
}

input.addEventListener("keydown", (e) => {
  if (e.key == "Enter") {
    DataSender.sendMessage(input.value, undefined);
  }
});

button.addEventListener("click", () => {
  isConnected
    ? undefined
    : () => {
        return;
      };

      if (isInputFocused) {
        DataSender.sendMessage(input.value, undefined);
      }

});
