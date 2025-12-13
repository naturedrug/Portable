import fs from "fs"
import path from "path"
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "db", "db.json")

class Utils {

    async init() {
        this.database = await fs.promises.readFile(dbPath, "utf-8")
        this.dbParsed = JSON.parse(this.database)
    }

    async write(parsed) {

        
        await fs.promises.writeFile(dbPath, JSON.stringify(parsed, null, 2), 'utf-8')
    }

    async clear() {       
                this.database = await fs.promises.readFile(dbPath, "utf-8")
        this.dbParsed = JSON.parse(this.database)

        this.dbParsed.channels = []
        this.dbParsed.users = []

        this.write(this.dbParsed)
    }
}

const dbUtils = new Utils()

switch (process.argv[2]) {
    case "cl":
        dbUtils.clear()
        break;

    default:
        break;
}