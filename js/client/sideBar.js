class Sidebar {
  constructor() {
    this.isOpened = false;
    this.sideBar = document.querySelector(".sideBar")
    this.closeSidebarArrow = document.querySelector(".closeSidebar")

    this.closeSidebarArrow.addEventListener("click", () => {
        if (!this.isOpened) {
            this.openSidebar()
        } else {
            this.closeSidebar()
        }
    })

    this.restoreChats()
  }

  async restoreChats() {
    const localStorageAccount = JSON.parse(localStorage.getItem("account"))
    if (!localStorageAccount.username || !localStorageAccount.token) {
        window.location.href = "/auth"
        return
    }

    let user = await fetch("/api/acc-info", {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({
            username: localStorageAccount.username,
            token: localStorageAccount.token
        })
    })

    if (!user.ok) {
        console.error("getting acc info is not ok")
        return
    }

    user = await user.json()
  }

  openSidebar() {
    this.sideBar.style.width = "20%";
    this.closeSidebarArrow.style.transform = "none";
    this.isOpened = true;
  }

  closeSidebar() {
    this.sideBar.style.width = "50px";
    this.closeSidebarArrow.style.transform = "rotate(180deg)";
    this.isOpened = false;
  }
}

new Sidebar()
