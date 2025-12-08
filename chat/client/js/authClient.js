import serverConfig from "./serverConfig.js"

const authForm = document.querySelector(".authForm form")
const loginField = document.getElementById("login")
const passwordField =  document.getElementById("password")


authForm.addEventListener('submit', async (event) => {
    event.preventDefault()

    let response = await fetch(`http://${serverConfig.hostname}:${serverConfig.port}/api/auth`, {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({
            username: loginField.value,
            password: passwordField.value
        })
    })

    response = await response.json()

    if (response.success) {
        localStorage.setItem("account", JSON.stringify({
            token: response.token,
            username: loginField.value
        }))
        window.location.href = "/chat"
    } else {
        alert("Неправильный логин или пароль")
    }
})
