import Channels from "./channels.js";
import socket from "./socket.js";

const messagesDiv = document.querySelector(".content");
const sendingDiv = document.querySelector(".sending .messageInput")

class NewChannelPrompt {
  constructor() {
    this.newChannelPrompt = document.querySelector(".createNewChannel");
    this.createChannelButton = document.querySelector(".newChat");
    this.closeNewChannelPrompt = document.querySelector(".closeCreateNewChannel");
    this.avatarInput = document.getElementById("channelAvatar");
    this.channelNameInput = document.getElementById("channelName");
    this.newChannelButton = document.getElementById("createChannelButton");
    this.createChannelButton.addEventListener("click", () => {
      this.newChannelPrompt.style.display = "flex";
    });
    this.closeNewChannelPrompt.addEventListener("click", () => {
      this.newChannelPrompt.style.display = "none";
    });
    this.newChannelButton.addEventListener("click", () => {
      this.createNewChannel();
    });
  }

  async createNewChannel() {
    const formData = new FormData();
    const localStorageAccount = JSON.parse(localStorage.getItem("account"));

    formData.append("token", localStorageAccount.token);
    formData.append("channelName", this.channelNameInput.value);
    formData.append("avatar", this.avatarInput.files[0]);

    let response = await fetch("/api/new-channel", { method: "POST", body: formData });
    response.json().then(() => {
      this.newChannelPrompt.style.display = "none";
      Channels.joinChannel(this.channelNameInput.value, localStorageAccount.username, localStorageAccount.token, () => {
        window.location.reload();
      });
    });
  }
}

class Sidebar {
  constructor() {
    this.sideBar = document.querySelector(".sideBar");
    this.isOpened = false;
    this.loadedChats = [];
    this.restoreChats();
    this.initResize();
  }

  createChatBlock(title, avatar, roomId, lastMessage) {
    const chatBlock = document.createElement("div");
    chatBlock.classList.add("channel");

    const channelName = document.createElement("div")
    channelName.classList.add("channelName")

    const channelTitle = document.createElement("h3");
    channelTitle.classList.add("channelTitle");
    channelTitle.textContent = title;

    const channelAvatar = document.createElement("img");
    channelAvatar.classList.add("channelAvatar");
    channelAvatar.src = avatar;

    channelName.append(channelTitle, channelAvatar)
    chatBlock.append(channelName);
    this.sideBar.appendChild(chatBlock);
    chatBlock.addEventListener("click", async () => {
      this.openPreload();
      socket.emit("change-room", JSON.parse(localStorage.getItem("account")).token, roomId);
      document.cookie = `room=${roomId}`;
      if (!this.loadedChats.includes(roomId)) {
        this.loadedChats.push(roomId);

        const loadChat = document.createElement("div");
        loadChat.classList.add(`chat-${roomId}`, "chat");
        messagesDiv.appendChild(loadChat);

        let channelInfo = await fetch("/api/full-channel-info", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ channelID: roomId, token: JSON.parse(localStorage.getItem("account")).token }),
        });
        channelInfo = await channelInfo.json();
        if (channelInfo.messages) {
          channelInfo.messages.forEach(async message => {
            let userInfo = await fetch("/api/acc-info-by-id", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ id: message.userID }),
            });
            userInfo = await userInfo.json();

            const msg = document.createElement("div");
            msg.classList.add("message");

            const userContainer = document.createElement("div");
            userContainer.classList.add("messageContainer");

            const avatarImg = document.createElement("img");
            avatarImg.src = userInfo.avatar;
            avatarImg.classList.add("avatar");

            const username = document.createElement("a");
            username.href = `/users/${userInfo.username}`;
            username.classList.add("username")
            username.textContent = userInfo.username;

            const text = document.createElement("p");
            text.textContent = message.text;
            userContainer.append(avatarImg, username, text);
            msg.appendChild(userContainer);
            if (message.media) {
              const mediaImg = document.createElement("img");
              mediaImg.src = message.media;
              mediaImg.classList.add("messageMedia");
              msg.appendChild(mediaImg);
            }
            loadChat.appendChild(msg);
          });
        }
      }
      document.querySelectorAll(".content .chat").forEach(c => c.style.display = "none");
      document.querySelector(`.content .chat-${roomId}`).style.display = "flex";
      this.closePreload();
    });
  }

  async restoreChats() {
    const localStorageAccount = JSON.parse(localStorage.getItem("account"));

    if (!localStorageAccount.username || !localStorageAccount.token) { window.location.href = "/auth"; return; }
    let user = await fetch("/api/acc-info", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: localStorageAccount.username, token: localStorageAccount.token }),
    });

    user = await user.json();

    if (!user.channels) { document.querySelector(".preloader").style.display = "none"; return; }
    for (const channel of user.channels) {
      const channelInfo = await Channels.channelInfo(channel.channelID);

      let name = channelInfo.channelName;

      if (name.length > 15) name = name.slice(0, 15) + " ...";

      this.createChatBlock(name, channelInfo.avatar, channel.channelID);
    }
    document.querySelector(".preloader").style.display = "none";
  
    for (const PM of user.pms) {
      
    }
  }

  openPreload() { document.querySelector(".contentPreloader").style.display = "flex"; }
  closePreload() { document.querySelector(".contentPreloader").style.display = "none"; }

  initResize() {
    const handle = document.createElement("div");
    handle.classList.add("sideBar-handle");

    this.sideBar.appendChild(handle);
    let isResizing = false;

    const savedResizeW = Number(localStorage.getItem("sidebar_resize"))

    this.sideBar.style.width = savedResizeW + "px"
    document.querySelector(".content").style.marginLeft = savedResizeW + "px";
    sendingDiv.style.paddingLeft = savedResizeW + 5 + "px"


    handle.addEventListener("mousedown", () => { isResizing = true; });
    document.addEventListener("mousemove", e => {
      if (!isResizing) return;
      let w = e.clientX; if (w < 75) w = 75;  if (w > 400) w = 400;

      localStorage.setItem("sidebar_resize", w)

      this.sideBar.style.width = w + "px";

      if (w < 410) {
        sendingDiv.style.paddingLeft = w + "px"
      }


      document.querySelector(".content").style.marginLeft = w + "px";

      document.querySelectorAll(".channelTitle").forEach(t => t.style.opacity = w > 100 ? 1 : 0);
    });
    document.addEventListener("mouseup", () => { isResizing = false; });
  }
}

new Sidebar();
new NewChannelPrompt();
