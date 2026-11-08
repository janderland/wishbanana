import {MatchMaker} from "./match.ts";
import {Game} from "./game.ts";

const singlePlayer = Deno.env.get("WB_SINGLE_PLAYER") !== undefined;
let gameID = 0;
let connID = 0;

// Behind a reverse proxy (e.g. exe.dev), remoteAddr is the proxy's address,
// so prefer the client IP from X-Forwarded-For for logging.
function clientIP(req: Request, info: Deno.ServeHandlerInfo<Deno.NetAddr>): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
        const ips = forwarded.split(",");
        return ips[ips.length - 1].trim();
    }
    return info.remoteAddr.hostname;
}

const matchMaker = new MatchMaker<WebSocket>(singlePlayer, (player1, player2) => {
    console.log("starting game");
    new Game((++gameID).toString(), player1, player2);
});

console.log("Server starting...");

Deno.serve((req, info) => {
    console.log(`Request received: ${req.method} ${req.url}`);

    const ip = clientIP(req, info);

    if (req.headers.get("upgrade") != "websocket") {
        console.log(`Rejecting connection from ${ip}`);
        return new Response(null, {status: 400});
    }

    // Matchmaking is keyed by a per-connection ID rather than the client IP,
    // since many clients can share an IP (NAT, or a reverse proxy).
    const remote = `${++connID}@${ip}`;
    console.log(`Accepting connection ${remote}`);

    const {socket, response} = Deno.upgradeWebSocket(req, {protocol: "wishbanana"});

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
