import express from "express";

import fs from "fs"
import path from "path";

const router = express.Router()



router.get("/auth", async (req, res) => {
    const authHtml = await fs.promises.readFile(path.join(import.meta.dirname, "..", "client", "templates", "auth.html"))


    res.end(authHtml)
})

router.get("/chat", async (req, res) => {
    const chatHtml = await fs.promises.readFile(path.join(import.meta.dirname, "..", 'client', "templates", "chat.html"))

    res.end(chatHtml)
})

router.get("/reg", async (req, res) => {
    const regHtml = await fs.promises.readFile(path.join(import.meta.dirname, "..", "client", "templates", "registration.html"))

    res.end(regHtml)
})

export default router
