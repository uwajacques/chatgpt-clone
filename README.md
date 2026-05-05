# Chat App Monorepo

This is a monorepo containing a frontend chat application and a backend server.

## Structure

- `apps/frontend`: Next.js chat application.
- `apps/backend`: Hono backend server using Bun.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed.

### Installation

```bash
bun install
```

### Running the applications

Run all applications in development mode:

```bash
bun dev
```

Or run specific applications:

```bash
bun --filter frontend dev
bun --filter backend dev
```

## Backend API

- `GET /ping`: Checks if the server is alive. Returns `{"message":"pong"}`.
