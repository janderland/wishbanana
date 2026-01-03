import {MatchMaker} from "./match.ts";
import {Game} from "./game.ts";

const singlePlayer = Deno.env.get("WB_SINGLE_PLAYER") !== undefined;
let gameID = 0;

const matchMaker = new MatchMaker<WebSocket>(singlePlayer, (player1, player2) => {
    console.log("starting game");
    new Game((++gameID).toString(), player1, player2);
});

console.log("Server starting...");

Deno.serve((req, info) => {
    console.log(`Request received: ${req.method} ${req.url}`);

    if (req.headers.get("upgrade") != "websocket") {
        console.log(`Rejecting connection from ${info.remoteAddr.hostname}`);
        return new Response(null, {status: 400});
    }
    console.log(`Accepting connection from ${info.remoteAddr.hostname}`);

    const {socket, response} = Deno.upgradeWebSocket(req, {protocol: "wishbanana"});
    const remote = info.remoteAddr.hostname

    socket.addEventListener("open", () => {
        matchMaker.enqueue(remote, socket);
    });

    socket.addEventListener("close", (event) => {
        if (matchMaker.drop(remote)) {
            console.log(`Closed during match making ${remote}: ${JSON.stringify(event)}`);
        }
    })

    socket.addEventListener("error", (event) => {
        if (matchMaker.drop(remote)) {
            console.log(`Errored during match making ${remote}: ${JSON.stringify(event)}`);
        }
    })

    return response;
});
