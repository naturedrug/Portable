import Channels from "./channels.js";
import DOM from "./DOMUse.js"; 

const DOMObj = new DOM()


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
    this.loadedChats = [];
    this.restoreChats();
    this.initResize();
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

    if (!user.channels && !user.pms) { document.querySelector(".preloader").style.display = "none"; return; }

    if (user.channels) {
      for (const channel of user.channels) {
        const channelInfo = await Channels.channelInfo(channel.channelID);

        if (channelInfo.channelName) {
          let name = channelInfo.channelName;

          if (name.length > 15) name = name.slice(0, 15) + " ...";

          DOMObj.createChatBlock(name, channelInfo.avatar, channel.channelID, undefined, false);
        }

      }
    }



    if (user.pms) {

      for (const PM of user.pms) {

        let response = await fetch("/api/pm-info", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            token: localStorageAccount.token,
            PM: PM
          })
        })

        response = await response.json()

        const PMMembers = response.members

        const secondMember = (user.id == PMMembers[0]) ? PMMembers[1] : PMMembers[0]



        let secondMemberInfo = await fetch("/api/acc-info-by-id", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            id: secondMember
          })
        })

        secondMemberInfo = await secondMemberInfo.json()

        DOMObj.createChatBlock(secondMemberInfo.username, secondMemberInfo.avatar, PM, undefined, true)
      }
    }

    document.querySelector(".preloader").style.display = "none";

  }

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
      let w = e.clientX; if (w < 75) w = 75; if (w > 400) w = 400;

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
