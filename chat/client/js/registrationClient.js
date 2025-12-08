import serverConfig from "./serverConfig.js"

const registerForm = document.querySelector(".authForm form")

const loginFieldReg = document.getElementById("login")
const passwordFieldReg = document.getElementById("password")
const confirmPasswordFieldReg = document.getElementById("confirmPassword")

registerForm.addEventListener("submit", async (e) => {
    e.preventDefault()


    if (passwordFieldReg.value !== confirmPasswordFieldReg.value) {
        alert("Пароли не совпадают")

        return;
    }

    let response = await fetch(`http://${serverConfig.hostname}:${serverConfig.port}/api/reg`, {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({
            username: loginFieldReg.value,
            password: passwordFieldReg.value
        })
    })

    response = await response.json()

    if (response.success) {
        window.location.href = "/auth"
    }

})
