import fs from "fs"
import path from "path"
import { fileURLToPath } from "url";
import readline from "readline"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface(process.stdin, process.stdout)

const dbPath = path.join(__dirname, "db", "db.json")

async function input() {
    return new Promise((resolve) => {
        rl.question('are you sure? (Y/N): ', (answer) => {
            resolve(answer);
            rl.close()
        });
    });
}

async function deleteUploads() {
        const uploads = await fs.promises.readdir(path.join("uploads"))

        uploads.forEach(async (upload) => {
            if (upload != "1") {
                await fs.promises.unlink(path.join("uploads", upload))
            }

            // '1' file is for github dir's finding
        })
}

class Utils {

    async init() {
        this.database = await fs.promises.readFile(dbPath, "utf-8")
        this.dbParsed = JSON.parse(this.database)
    }

    async write(parsed) {


        await fs.promises.writeFile(dbPath, JSON.stringify(parsed, null, 2), 'utf-8')
    }

    async clearAll() {
        await this.init()

        this.dbParsed.channels = []

        this.dbParsed.users = []

        this.dbParsed.pms = []

        deleteUploads()


        this.write(this.dbParsed)
    }

    async clearChannels() {
        await this.init()

        this.dbParsed.channels = []

        this.dbParsed.pms = []

        this.write(this.dbParsed)
    }

    async clearUsers() {
        await this.init()

        this.dbParsed.users = []

        this.write(this.dbParsed)

    }

    async clearMessages() {
        await this.init()

        for (const channel of this.dbParsed.channels) {
            channel.messages = []
        }

        for (const PM of this.dbParsed.pms) {
            PM.messages = []
        }

        this.write(this.dbParsed)
    }

    async clearPMS() {
        await this.init()

        this.dbParsed.pms = []

        this.write(this.dbParsed)
    }

    async clearUploads() {
        deleteUploads()
    }
}

const utils = new Utils()

switch (process.argv[2]) {

    case "cl":
        const answer = await input()

        if (answer == "Y") {

            switch (process.argv[3]) {
                case "a":
                    utils.clearAll()
                    break;
                case "c":
                    utils.clearChannels()
                case "u":
                    utils.clearUsers()
                case "m":
                    utils.clearMessages()
                case "p":
                    utils.clearPMS()
                case "upl":
                    utils.clearUploads()
                default:
                    break;
            }
        }


    default:
        break;
}