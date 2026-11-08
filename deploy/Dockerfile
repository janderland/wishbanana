# Build from the repo root: docker build -f deploy/Dockerfile .
FROM denoland/deno:2.9.8

WORKDIR /app
COPY server/ .

USER deno
EXPOSE 8000
CMD ["run", "--allow-net", "--allow-env", "main.ts"]
