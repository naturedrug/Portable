import Channels from "./channels.js";
import serverConfig from "./serverConfig.js";

const socket = io(`http://${serverConfig.hostname}:${serverConfig.port}`);

class Sidebar {
  constructor() {
    this.isOpened = false;
    this.sideBar = document.querySelector(".sideBar");
    this.chats = []

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

    this.restoreChats();
  }

  createChatBlock(title, desc, avatar, roomId) {
    const chatBlock = document.createElement("div")
    chatBlock.classList.add("channel")

    const channelTitle = document.createElement("h3")
    channelTitle.classList.add("channelTitle")
    channelTitle.textContent = title

    const channelAvatar = document.createElement("img")
    channelAvatar.classList.add("channelAvatar")
    channelAvatar.src = avatar
    channelAvatar.alt = "channel avatar"

    const channelDesc = document.createElement("p")
    channelDesc.classList.add("channelDesc")
    channelDesc.textContent = desc


    this.sideBar.appendChild(chatBlock)
    chatBlock.appendChild(channelTitle)
    chatBlock.appendChild(channelAvatar)
    chatBlock.appendChild(channelDesc)

    chatBlock.addEventListener("click", () => {
      socket.emit("change-room", JSON.parse(localStorage.getItem("account")).token, roomId)
      document.cookie = `room=${roomId}`
    })
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

    // Channels.joinChannel("d5kw-9dTQ8gBeEnug29pO", localStorageAccount.username, localStorageAccount.token)




    if (!user.channels) {
      console.log("don't have any chats");
      return;
    }

    user.channels.forEach(async (channel) => {
      
      const channelInfo = await Channels.channelInfo(channel.channelID)
      
      console.log(channelInfo)

      this.createChatBlock(channelInfo.channelName, channelInfo.desc || "", channelInfo.avatar, channel.channelID)
    });
  }

  openSidebar() {
    this.sideBar.style.width = "20%";
    this.isOpened = true;
  }

  closeSidebar() {
    this.sideBar.style.width = "50px";
    this.isOpened = false;
  }
}

new Sidebar();
