import Channels from "./channels.js"


const joinButton = document.querySelector(".joinButton")

function getCookie(name) {
  let matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

joinButton.addEventListener("click", () => {
    console.log(getCookie("channelid"))

    const localStorageAccount = JSON.parse(localStorage.getItem("account"))

    Channels.joinChannel(getCookie("channelid"), localStorageAccount.username, localStorageAccount.token)

    window.location.href = "/chat"
})
