import {Queue} from "./queue.ts";
import {Game} from "./game.ts";

const SINGLE = Deno.env.get("WB_SINGLE_PLAYER") !== undefined;
const PROTOCOL = "wishbanana";
let gameID = 0;
let connID = 0;

const queue = new Queue<WebSocket>(SINGLE, (p1, p2) => {
  new Game((++gameID).toString(), p1, p2);
});

const clientIP = (req: Request, addr: Deno.NetAddr): string => {
  // Behind a reverse proxy, remoteAddr is the proxy's address,
  // so prefer the client IP from X-Forwarded-For.
  return req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || addr.hostname;
};

const validate = (req: Request, ip: string): Response | null => {
  if (req.method != "GET") {
    console.log(`${ip} :: invalid method '${req.method}'`);
    return new Response(null, {status: 400});
  }

  const pathname = new URL(req.url).pathname
  if (pathname != "/") {
    console.log(`${ip} :: invalid path '${pathname}'`);
    return new Response(null, {status: 400});
  }

  const upgrade = req.headers.get("upgrade");
  if (upgrade != "websocket") {
    console.log(`${ip} :: invalid upgrade '${upgrade}'`);
    return new Response(null, {status: 400});
  }

  const protocols = req.headers.get("sec-websocket-protocol")?.split(",").map((p) => p.trim());
  if (!protocols?.includes(PROTOCOL)) {
    console.log(`${ip} :: invalid protocols '${protocols}'`);
    return new Response(null, {status: 400});
  }

  return null;
};

const accept = (req: Request, ip: string): Response => {
  const {socket, response} = Deno.upgradeWebSocket(req, {protocol: PROTOCOL});

  // Matchmaking is not only keyed by client IP, but also by an
  // incrementing ID. This allows multiple connections from a
  // single IP. This may be necessary if multiple clients are
  // behind a NAT or there is a reverse-proxy infront of this
  // server.
  const clientID = `conn${connID}@${ip}`;
  console.log(`${ip} :: accepting connection ${connID}`);
  connID++;

  socket.addEventListener("open", () => {
    console.log(`${clientID} :: socket open`);
    queue.enqueue(clientID, socket);
  });

  socket.addEventListener("close", (event) => {
    if (queue.drop(clientID)) {
      console.log(`${clientID} :: socket close :: ${JSON.stringify(event)}`);
    }
  });

  socket.addEventListener("error", (event) => {
    if (queue.drop(clientID)) {
      console.log(`${clientID} :: socket error :: ${JSON.stringify(event)}`);
    }
  });

  return response;
};

Deno.serve((req, info) => {
  const ip = clientIP(req, info.remoteAddr);
  return validate(req, ip) || accept(req, ip);
});

console.log("ready");
