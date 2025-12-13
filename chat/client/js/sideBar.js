import Channels from "./channels.js";

import socket from "./socket.js";

const messagesDiv = document.querySelector(".content");

class NewChannelPrompt {
  constructor() {
    this.newChannelPrompt = document.querySelector(".createNewChannel");
    this.createChannelButton = document.querySelector(".newChat");
    this.closeNewChannelPrompt = document.querySelector(
      ".closeCreateNewChannel"
    );

    // form

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

    let response = await fetch("/api/new-channel", {
      method: "POST",
      body: formData,
    });

    response = await response.json();

    this.newChannelPrompt.style.display = "none";
  }
}

class Sidebar {
  constructor() {
    this.isOpened = false;
    this.sideBar = document.querySelector(".sideBar");

    this.chats = [];

    this.sideBar.addEventListener("mouseover", () => {
      if (!this.isOpened) {
        this.openSidebar();
      }
    });

    this.sideBar.addEventListener("mouseout", () => {
      if (this.isOpened) {
        this.closeSidebar();
      }
    });

    this.loadedChats = [];

    this.restoreChats();
  }

  createChatBlock(title, desc, avatar, roomId) {
    const chatBlock = document.createElement("div");
    chatBlock.classList.add("channel");

    const channelTitle = document.createElement("h3");
    channelTitle.classList.add("channelTitle");
    channelTitle.textContent = title;

    const channelAvatar = document.createElement("img");
    channelAvatar.classList.add("channelAvatar");
    channelAvatar.src = avatar;
    channelAvatar.alt = "channel avatar";

    const channelDesc = document.createElement("p");
    channelDesc.classList.add("channelDesc");
    channelDesc.textContent = desc;

    this.sideBar.appendChild(chatBlock);
    chatBlock.appendChild(channelTitle);
    chatBlock.appendChild(channelAvatar);
    chatBlock.appendChild(channelDesc);

    function createNewMessageBlock(where, author, avatar, media, text, my) {
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

      const container = document.createElement("div");

      container.classList.add("messageContainer");

      where.appendChild(message);
      message.appendChild(container);
      container.appendChild(authorUsername);
      container.appendChild(messageText);
    }

    chatBlock.addEventListener("click", async () => {
      this.openPreload()

      console.log("change-room to " + roomId);

      socket.emit(
        "change-room",
        JSON.parse(localStorage.getItem("account")).token,
        roomId
      );
      document.cookie = `room=${roomId}`;


      if (!this.loadedChats.includes(roomId)) {
        this.loadedChats.push(roomId);

        const loadChat = document.createElement("div");
        loadChat.classList.add(`chat-${roomId}`, "chat");

        messagesDiv.appendChild(loadChat);

        let channelInfo = await fetch("/api/full-channel-info", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            channelID: roomId,
            token: JSON.parse(localStorage.getItem("account")).token,
          }),
        });

        channelInfo = await channelInfo.json();

        if (channelInfo.messages) {

          channelInfo.messages.forEach(async (message) => {

            let userInfo = await fetch("/api/acc-info-by-id", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                id: message.userID
              })
            })

            userInfo = await userInfo.json()

            createNewMessageBlock(loadChat, userInfo.username, userInfo.avatar, "", message.text)


          });
        }


      }
      const loadedChatsInDOM = document.querySelectorAll(".content .chat")
      const selectedChat = document.querySelector(`.content .chat-${roomId}`)

      loadedChatsInDOM.forEach((chat) => {
        chat.style.display = "none"
      })

      selectedChat.style.display = "block"

      this.closePreload()
    });
  }

  async restoreChats() {
    const localStorageAccount = JSON.parse(localStorage.getItem("account"));
    if (!localStorageAccount.username || !localStorageAccount.token) {
      window.location.href = "/auth";
      return;
    }

    let user = await fetch("/api/acc-info", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: localStorageAccount.username,
        token: localStorageAccount.token,
      }),
    });

    if (!user.ok) {
      console.error("getting acc info is not ok");
      return;
    }

    user = await user.json();

    if (!user.channels) {
      console.log("don't have any chats");
          document.querySelector(".preloader").style.opacity = 0

    setTimeout(() => {
      document.querySelector(".preloader").style.display = "none"
    }, 100)
      return;
    }

    for (const channel of user.channels) {
      const channelInfo = await Channels.channelInfo(channel.channelID);

      this.createChatBlock(
        channelInfo.channelName,
        channelInfo.desc || "",
        channelInfo.avatar,
        channel.channelID
      );
    }



    document.querySelector(".preloader").style.opacity = 0

    setTimeout(() => {
      document.querySelector(".preloader").style.display = "none"
    }, 100)
  }

  openSidebar() {
    const chatsP = document.querySelectorAll(".sideBar .channel .channelTitle")

    chatsP.forEach((chat) => {
      chat.style.opacity = 1
    })

    this.sideBar.style.width = "200px";
    this.isOpened = true;

    document.querySelector(".content").style.marginLeft = "220px"
  }

  closeSidebar() {
    const chatsP = document.querySelectorAll(".sideBar .channel .channelTitle")

    chatsP.forEach((chat) => {
      chat.style.opacity = 0
    })

    this.sideBar.style.width = "75px";
    document.querySelector(".content").style.marginLeft = "95px"
    this.isOpened = false;
  }

  openPreload() {
    const preloader = document.querySelector(".contentPreloader")
    preloader.style.display = "flex"
  }

  closePreload() {
    const preloader = document.querySelector(".contentPreloader")
    preloader.style.display = "none"
  }
}

new Sidebar();
new NewChannelPrompt();
