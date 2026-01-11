# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wish Banana is a competitive web-based click game where two players race to click a banana fastest. Monorepo with TypeScript client (browser) and Deno server communicating via WebSocket.

## Commands

### Client (`/client`)
```bash
deno task build      # Compile TypeScript to dist/
deno task dev        # Watch mode compilation
deno task lint       # Run linter
deno task fmt        # Format code
```

### Server (`/server`)
```bash
deno task dev        # Run with watch mode
deno lint            # Lint all files
deno test            # Run all tests
deno test game_test.ts  # Run single test file
```

## Architecture

### Client (`/client/src`)
- **main.ts** - Entry point, page routing and event orchestration
- **game.ts** - WebSocket game client (state machine: Connected → Naming → Matched → Playing → GameOver)
- **state.ts** - PageManager for hierarchical page state management (pages hidden/shown via CSS)
- **messages.ts** - Message type definitions (must stay in sync with server)
- **animations.ts** - Hand animation logic using CSS transforms
- **dom.ts** - DOM utility helpers

### Server (`/server`)
- **main.ts** - Entry point, WebSocket server on port 8000
- **game.ts** - Game state machine (Naming → Counting → Gaming → Done). States are classes implementing `State` interface with RAII pattern (constructors set up timers, `stop()` cleans them up)
- **match.ts** - MatchMaker pairs players or enables single-player mode via `WB_SINGLE_PLAYER` env var
- **message.ts** - Message types and serialization (must stay in sync with client)
- **websocket.ts** - WebSocket interface abstraction for mocking in tests

### Message Protocol
WebSocket with binary subprotocol "wishbanana". 8 message types (NAMEPLEASE, NAME, MATCHED, COUNTDOWN, CLICK, CLICKCOUNT, GAMEOVER, WINCOUNT) defined in message.ts files on both client and server.

## Game Flow
1. WebSocket connects, server sends NAMEPLEASE
2. Both players submit names → MATCHED with opponent info
3. 5-second COUNTDOWN before playing
4. Players click rapidly, server broadcasts CLICKCOUNT every 300ms
5. First to reach winCount (default 50) wins → GAMEOVER

## Testing
Server tests use Deno's `@std/testing` with spy mocks and FakeTime. Tests inject custom state initializers to test specific game scenarios. WebSocket interface abstraction enables mocking.

## Important Notes
- **Message sync is critical**: Client `messages.ts` and server `message.ts` must stay in sync
- **Client WebSocket URL**: Hardcoded to `wss://wishbanana.com` (production only)
- **Single player testing**: Set `WB_SINGLE_PLAYER=true` env var to use auto-responding bot
