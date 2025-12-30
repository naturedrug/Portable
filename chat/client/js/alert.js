class Alert {
    constructor() {
        this.alertBar = document.querySelector(".alertBar")
        this.alertHeight = 75

        if (!this.alertBar) {
            console.error("don't have .alertBar")
            return
        }

        this.alertP = document.querySelector(".alertBar p")
    }

    openAlert() {
        this.alertBar.style.top = "0px"
    }

    closeAlert() {
        this.alertBar.style.top = `${-this.alertHeight}px`
    }

    simple(text, time) {
        this.alertP.textContent = text;

        this.openAlert()

        setTimeout(() => {
            this.closeAlert()
            this.alertP.textContent = ""
        }, time)
    }

    question(text) {
        return new Promise((res, rej) => {
            
        })
    }
}

export default Alert