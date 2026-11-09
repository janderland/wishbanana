import {MatchMaker} from "./match.ts";
import {Game} from "./game.ts";

const SINGLE = Deno.env.get("WB_SINGLE_PLAYER") !== undefined;
const PROTOCOL = "wishbanana";
let gameID = 0;
let connID = 0;

const matchMaker = new MatchMaker<WebSocket>(SINGLE, (p1, p2) => {
  new Game((++gameID).toString(), p1, p2);
});

const clientIP = (req: Request, addr: Deno.NetAddr): string => {
  // Behind a reverse proxy, remoteAddr is the proxy's address,
  // so prefer the client IP from X-Forwarded-For.
  return req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || addr.hostname;
};

const validate = (req: Request): Response | null => {
  if (req.method != "GET") {
    return new Response(null, {status: 400});
  }

  if (new URL(req.url).pathname != "/") {
    return new Response(null, {status: 400});
  }

  if (req.headers.get("upgrade") != "websocket") {
    return new Response(null, {status: 400});
  }

  if (!req.headers.get("sec-websocket-protocol")?.split(",").map((p) => p.trim())?.includes(PROTOCOL)) {
    return new Response(null, {status: 400});
  }

  return null;
};

const accept = (req: Request, ip: string): Response => {
  console.log(`accepting connection ${ip}`);

  const {socket, response} = Deno.upgradeWebSocket(req, {protocol: PROTOCOL});

  // Matchmaking is not only keyed by client IP, but also by an
  // incrementing ID. This allows multiple connections from a
  // single IP. This may be necessary if multiple clients are
  // behind a NAT or there is a reverse-proxy infront of this
  // server.
  const clientID = `${ip}:${++connID}`;

  socket.addEventListener("open", () => {
    matchMaker.enqueue(clientID, socket);
  });

  socket.addEventListener("close", (event) => {
    if (matchMaker.drop(clientID)) {
      console.log(`closed during queue ${clientID}: ${JSON.stringify(event)}`);
    }
  });

  socket.addEventListener("error", (event) => {
    if (matchMaker.drop(clientID)) {
      console.log(`errored during queue ${clientID}: ${JSON.stringify(event)}`);
    }
  });

  return response;
};

Deno.serve((req, info) => {
  const ip = clientIP(req, info.remoteAddr);

  const rejection = validate(req);
  if (rejection != null) return rejection;

  return accept(req, ip);
});

console.log("listening...");
