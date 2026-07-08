# Dev-server HTTPS config (Vite / CRA / Next)

Point your framework's dev server at the cert from [../flows/setup-local-https.md](../flows/setup-local-https.md) step 3 and bind it to the project domain + port. Replace `myapp.seliseblocks.com` / `5173` with your values.

## Vite (blocks-construct-react default)

```ts
// vite.config.ts
import { defineConfig } from "vite";
import fs from "node:fs";

const DOMAIN = "myapp.seliseblocks.com";
const PORT = 5173;

export default defineConfig({
  server: {
    host: DOMAIN,          // bind to the domain (hosts file maps it to 127.0.0.1)
    port: PORT,
    strictPort: true,      // fail instead of silently switching ports (keeps redirectUri stable)
    https: {
      key: fs.readFileSync(".cert/dev-key.pem"),
      cert: fs.readFileSync(".cert/dev-cert.pem"),
    },
    allowedHosts: [DOMAIN], // Vite 5+ may block non-localhost hosts without this
    // HMR over https on a custom host sometimes needs an explicit clientPort:
    // hmr: { host: DOMAIN, protocol: "wss", clientPort: PORT },
  },
});
```

Prefer env-driven values so the domain/port aren't hardcoded across the app:
```ts
const DOMAIN = process.env.VITE_DEV_DOMAIN ?? "localhost";
const PORT = Number(process.env.VITE_DEV_PORT ?? 5173);
```
```bash
# .env.local
VITE_DEV_DOMAIN=myapp.seliseblocks.com
VITE_DEV_PORT=5173
VITE_BLOCKS_REDIRECT_URI=https://myapp.seliseblocks.com:5173/login/callback
```

`npm run dev` → serves `https://myapp.seliseblocks.com:5173`.

## Create React App

CRA reads HTTPS settings from env, not a config file:
```bash
# .env  (or exported before `npm start`)
HTTPS=true
SSL_CRT_FILE=.cert/dev-cert.pem
SSL_KEY_FILE=.cert/dev-key.pem
HOST=myapp.seliseblocks.com
PORT=5173
```
`npm start` → `https://myapp.seliseblocks.com:5173`.

## Next.js

Next's dev server supports HTTPS with the experimental flag (Next 13.5+):
```jsonc
// package.json
"scripts": {
  "dev": "next dev --experimental-https --experimental-https-key .cert/dev-key.pem --experimental-https-cert .cert/dev-cert.pem -H myapp.seliseblocks.com -p 5173"
}
```
For older Next, front it with a local HTTPS proxy (e.g. `local-ssl-proxy --source 5173 --target 3000 --cert .cert/dev-cert.pem --key .cert/dev-key.pem`) and browse the proxied https port.

## Notes

- **`strictPort`/fixed port** matters: the port is part of the registered `redirectUri`, so don't let the server drift to another port.
- The cert must include the exact `DOMAIN` in its `subjectAltName` (the openssl command in the flow does this).
- Keep `.cert/` in `.gitignore`; each developer runs the openssl cert step (and trusts it) on their own machine.
