FROM denoland/deno:2.9.8

WORKDIR /app
COPY . .

USER deno
EXPOSE 8000
CMD ["run", "--allow-net", "--allow-env", "main.ts"]
