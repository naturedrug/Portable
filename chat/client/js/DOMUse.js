import socket from "./socket.js";

const sideBar = document.querySelector(".sideBar")

const messagesDiv = document.querySelector(".content");

class DOM {
    constructor() {
        this.loadedChats = [];
    }

    createChatBlock(title, avatar, roomId, lastMessage, isPM) {
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
        sideBar.appendChild(chatBlock);

        chatBlock.addEventListener("click", async () => {
            this.openPreload();
            socket.emit("change-room", JSON.parse(localStorage.getItem("account")).token, roomId);
            document.cookie = `room=${roomId}`;
            if (!this.loadedChats.includes(roomId)) {
                this.loadedChats.push(roomId);

                const loadChat = document.createElement("div");
                loadChat.classList.add(`chat-${roomId}`, "chat");
                messagesDiv.appendChild(loadChat);

                if (!isPM) {

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
                } else {
                    // IF IT"S PM

                    let PMInfo = await fetch("/api/pm-info", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ PM: roomId, token: JSON.parse(localStorage.getItem("account")).token }),
                    });

                    PMInfo = await PMInfo.json();
                    if (PMInfo.messages) {
                        PMInfo.messages.forEach(async message => {
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

            }

            document.querySelectorAll(".content .chat").forEach(c => c.style.display = "none");
            document.querySelector(`.content .chat-${roomId}`).style.display = "flex";
            this.closePreload();
        });
    }

  openPreload() { document.querySelector(".contentPreloader").style.display = "flex"; }
  closePreload() { document.querySelector(".contentPreloader").style.display = "none"; }

}

export default DOM