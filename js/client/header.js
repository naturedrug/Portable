const header = document.querySelector(".header");

if (!header) {
  throw new Error("don't have .header");
}

const search = document.querySelector(".header .search");

search.addEventListener("keydown", async (e) => {
  if (e.key == "Enter") {
    const user = await goSearch(search.value)

    if (user) {
      window.location.href = `users/${user.username}`
    }
  }
})

async function goSearch(username) {
    let users = await fetch("/api/users")

    users = await users.json()

    const findedUser = users.find((user) => {

      if (user.username == username) {
        return user
      }
    })

    return findedUser
}

class Header {
  constructor() {

    this.injectCSS()
  }

  injectCSS() {
    const linkCSS = document.createElement("link")
    linkCSS.rel = "stylesheet"
    linkCSS.href = "/static/chatHeader.css"

    document.head.appendChild(linkCSS)
  }
}

new Header();
