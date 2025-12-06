class Channels {
    static async newChannel(channelName, token, avatar, desc) {
        let response = await fetch("/api/new-channel", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                channelName: channelName,
                token: token,
                avatar: avatar,
                desc: desc
            })
        })

        response = await response.json()

        if (response.success) {
            return true
        } else {
            console.log(response.error)
            return false
        }
    }

    static async joinChannel(channelID, username, token) {
        let response = await fetch("/api/join-channel", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                username: username,
                token: token,
                channelID: channelID
            })
        })

        response = await response.json()

        if (response.success) {
            return true
        } else {
            return false
        }
    }

    static async channelInfo(channelID) {
        let response = await fetch("/api/channel-info", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                channelID: channelID
            })
        })

        response = await response.json()

        return response
    }
}

export default Channels