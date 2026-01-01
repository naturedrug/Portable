import serverConfig from "./serverConfig.js";

import socket from "./socket.js";
import Alert from "./alert.js";
import getCookie from "./cookies.js"
import DOM from "./DOMUse.js";

const DOMObjC = new DOM()

const account = JSON.parse(localStorage.getItem("account"));

const alertBar = new Alert()


window.onload = async () => {
  if (!localStorage.getItem("account")) {
    window.location.href = "/auth";
  }
};

let user = await fetch("/api/acc-info", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    username: account.username,
    token: account.token
  })
})

user = await user.json()

if (!user) {
  window.location.href = "/auth";
}



let isConnected = false;

socket.on("connect", () => {
  isConnected = true;
  console.log("! client connected: " + socket.id);
});

socket.on("server_send_message", (message) => {


  SocketListeners.getMessage(
    message.userID,
    message.room,
    message.text,
    message.media
  );
});

socket.on("new-pm-client", async (senderID, PMID) => {
  console.log("new pm from " + senderID)

  let response = await fetch("/api/acc-info-by-id", {
    method: "POST",
    headers: {"content-type": "application/json"},
    body: JSON.stringify({
      id: senderID
    })
  })

  response = await response.json()

  DOMObjC.createChatBlock(response.username, response.avatar, PMID, undefined, true)
})

const button = document.querySelector("button");
const input = document.querySelector(".messageInput");
const mediaInput = document.querySelector(".imageInput")
// const content = document.querySelector(".content");

class DataSender {
  static async sendMessage(text, mediaDataURL) {
    if (!text) return;

    input.value = "";

    const file = mediaInput.files[0]

    if (file) {
      const reader = new FileReader()
  
      reader.onload = (e) => {
        createMessage(
          document.querySelector(`.chat-${getCookie("room")}`),
          account.username,
          user.avatar,
          e.target.result,
          text,
          true
        );
      }
  
      reader.readAsDataURL(file)
    } else {
              createMessage(
          document.querySelector(`.chat-${getCookie("room")}`),
          account.username,
          user.avatar,
          undefined,
          text,
          true
        );
    }

    socket.emit("send_message", {
      media: mediaDataURL || undefined,
      text: text,
      token: account.token,
    }, getCookie("room"));

    document.querySelector(`.chat-${getCookie("room")}`).scrollIntoView({block: 'end', behavior: 'smooth'})
  }
}

class SocketListeners {
  static async getMessage(senderID, room, text, mediaDataURL) {

    
    if (document.querySelector(`.chat-${room}`)) {
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

      createMessage(document.querySelector(`.chat-${room}`), user.username, user.avatar, mediaDataURL, text, false);

      if (document.querySelector(`.chat-${room}`).style.display == "flex") {
        document.querySelector(`.chat-${room}`).scrollIntoView({block: 'end', behavior: 'smooth'})
      }
    }

  }
}

function createMessage(where, author, avatar, media, text, my) {
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


  const userAvatar = document.createElement("img");
  userAvatar.classList.add("avatar");
  userAvatar.src = avatar;

  message.appendChild(userAvatar);

  if (media) {
    const messageMedia = document.createElement("img");
    messageMedia.classList.add("messageMedia");
    messageMedia.src = media;
    message.appendChild(messageMedia);
  }

  const container = document.createElement("div")

  container.classList.add("messageContainer")

  where.appendChild(message);
  message.appendChild(container)
  container.appendChild(authorUsername);
  container.appendChild(messageText);
}

input.addEventListener("keydown", async (e) => {
  if (e.key == "Enter") {
    const file = mediaInput.files[0]

    if (file) {
      const arrayBuffer = await file.arrayBuffer();
  
      const uint8Array = new Uint8Array(arrayBuffer);
  
      DataSender.sendMessage(input.value, uint8Array);

      mediaInput.value = ""
    } else {
      DataSender.sendMessage(input.value, undefined)

      mediaInput.value = ""
    }

  }
});


// input.addEventListener("click", async () => {

//   let response = await fetch("/api/create-invite", {
//     method: "POST",
//     headers: {"content-type": "application/json"},
//     body: JSON.stringify({
//       token: account.token,
//       username: account.username,
//     })
//   })

//   response = await response.json()

//   console.log("click: ",response)
// })

button.addEventListener("click", () => {
  isConnected
    ? undefined
    : () => {
      return;
    };


  DataSender.sendMessage(input.value, undefined);

});