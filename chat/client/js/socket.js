import serverConfig from "./serverConfig.js";

const socket = io(`http://${serverConfig.hostname}:${serverConfig.port}`);

export default socket
