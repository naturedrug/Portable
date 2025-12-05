// async function joinChannel() {
//     let response = await fetch("/api/join-channel", {
//       method: "POST",
//       headers: {"content-type": "application/json"},
//       body: JSON.stringify({
//         username: localStorageAccount.username,
//         token: localStorageAccount.token,
//         channelID: "sg5fdqlCGZwTBVmF3zLZl"
//       })
//     })

//     response = await response.json()
// }


class Sidebar {
  constructor() {
    this.isOpened = false;
    this.sideBar = document.querySelector(".sideBar");

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
      return;
    }

    user.channels.forEach((channel) => {
      console.log(channel)
      // creating channels
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
