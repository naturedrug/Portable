import socket from "./socket.js";

function getCookie(name) {
  let matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

const addFriend = document.querySelector(".addFriend")
const userID = document.querySelector(".profile").id


let user = await fetch("/api/acc-info", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    username: getCookie("username"),
    token: getCookie("token")
  })
})

user = await user.json()

if (!user) {
  window.location.href = "/auth";
}

addFriend.addEventListener("click", async () => {

    let response = await fetch("/api/new-pm", {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({
            token: getCookie("token"),
            friendID: userID
        })
    })



    response = await response.json()
    
    
    socket.emit("new-pm", user.id, userID, response.PMID)

    if (response.success) {



        window.location.href = "/chat"
    }
})