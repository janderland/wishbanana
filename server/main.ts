import {MatchMaker} from "./match.ts";
import {Game} from "./game.ts";

const singlePlayer = Deno.env.get("WB_SINGLE_PLAYER") !== undefined;
let gameID = 0;

const matchMaker = new MatchMaker<WebSocket>(singlePlayer, (player1, player2) => {
    console.log("starting game");
    new Game((++gameID).toString(), player1, player2);
});

const CLIENT_DIR = "../client";

const CONTENT_TYPES: Record<string, string> = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".svg": "image/svg+xml",
    ".map": "application/json",
};

function getContentType(path: string): string {
    for (const [ext, type] of Object.entries(CONTENT_TYPES)) {
        if (path.endsWith(ext)) return type;
    }
    return "application/octet-stream";
}

async function serveFile(path: string): Promise<Response> {
    try {
        const content = await Deno.readFile(path);
        return new Response(content, {
            headers: {"Content-Type": getContentType(path)},
        });
    } catch {
        return new Response("Not Found", {status: 404});
    }
}

console.log("Server starting...");

Deno.serve((req, info) => {
    const url = new URL(req.url);
    console.log(`Request received: ${req.method} ${url.pathname}`);

    // Handle WebSocket upgrades
    if (req.headers.get("upgrade") === "websocket") {
        console.log(`Accepting WebSocket from ${info.remoteAddr.hostname}`);

        const {socket, response} = Deno.upgradeWebSocket(req, {protocol: "wishbanana"});
        const remote = info.remoteAddr.hostname;

        socket.addEventListener("open", () => {
            matchMaker.enqueue(remote, socket);
        });

        socket.addEventListener("close", (event) => {
            if (matchMaker.drop(remote)) {
                console.log(`Closed during match making ${remote}: ${JSON.stringify(event)}`);
            }
        });

        socket.addEventListener("error", (event) => {
            if (matchMaker.drop(remote)) {
                console.log(`Errored during match making ${remote}: ${JSON.stringify(event)}`);
            }
        });

        return response;
    }

    // Serve static files
    if (url.pathname === "/") {
        return serveFile(`${CLIENT_DIR}/index.html`);
    }

    return serveFile(`${CLIENT_DIR}${url.pathname}`);
});
