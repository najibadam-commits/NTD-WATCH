# Demo setup guide

Everything runs locally in a browser. There is no server, database, account or internet connection to set up after install.

## Shortest path for a presenter

```
npm install
npm run demo
```

1. Open the URL the command prints. **Local:** `http://localhost:4173`. **Network:** the "Network" line it prints (for example `http://192.168.x.x:4173`) opens the same demo on another device on the same Wi-Fi.
2. Click **Open the CHW app** (PIN `1234`) or any "Open as" role button.
3. Click **Reset demo**, then **Yes, reset**, in the top banner.
4. Follow `DEMO_SCRIPT.md`. Switch role from the banner selector.
5. Press **Reset demo** between audiences. No developer tools or source code are needed.

On Windows PowerShell, if `npm` is blocked by script policy, use `npm.cmd install` and `npm.cmd run demo`. For editing the code, `npm run dev` serves at http://localhost:5173 instead.

If another device cannot connect, allow Node.js through the laptop firewall for private networks, and check both devices are on the same Wi-Fi (guest networks often isolate devices). Data is stored per device and per address, so another device starts with its own clean copy and its own role session.

## Requirements

Node.js 20 or newer and npm. A current Chrome, Edge or Firefox. The map needs WebGL; if it cannot draw, every other view still works.

## Run it (details)

`npm run demo` builds the app and serves the built copy (steadier for presenting, no hot reload). `npm run dev` is for development.

## Demo credentials (simulated, not security)

| Experience              | How to enter                                     | Notes                                               |
| ----------------------- | ------------------------------------------------ | --------------------------------------------------- |
| Community Health Worker | Landing page, **Open the CHW app**, PIN `1234`   | Synthetic CHW 0142, community Demo Riverside        |
| Health Facility Worker  | Landing page, **Open as Health Facility Worker** | Simulated scope: Demo North Primary Health Centre   |
| LGA Programme Officer   | Landing page button                              | Scope: Demo Central LGA                             |
| State Programme Manager | Landing page button                              | Scope: Arewa Demo State (sees scenarios A, B and C) |
| Super Administrator     | Landing page button                              | Scope: all. Users, settings, rule governance        |

You can switch role at any time from the selector in the top banner. The CHW session and its saved work survive role switches.

## Before every demonstration

1. Open the app and enter any role.
2. Click **Reset demo** in the top banner, then **Yes, reset**. This clears assessments, referrals, follow-ups, users, audit, the offline queue, the draft, the simulation switches and the filters, and regenerates the synthetic seed. Your role is kept.
3. Check the banner reads **NTD-WATCH DEMO MODE**.

Reset is safe to repeat. After it, every number returns to its starting value.

## Useful controls

- **CHW Profile page**: switches to simulate being offline, a server outage, a failed request or a lost response.
- **Settings (administrator)**: rule governance register, the real / simulated / future table, the unresolved-days setting.
- **Priority communities page**: matrix cell buttons filter the table; the trend and open-work filters narrow it; **Export CSV** downloads the shown rows.

## Browser storage

Records live in the browser's IndexedDB for this site address. Clearing site data or using a different address or browser gives a clean start. A private window starts clean each time.

## If something looks wrong

Press **Reset demo**. If a page is blank after a code change, stop and restart `npm run dev`. If port 5173 is busy, Vite prints another port.

## Checks a presenter can run

`npm run check` (types, lint, formatting, 270+ unit tests, build). `npm run test:e2e` (browser tests on a phone and a desktop profile; needs Playwright's browser, installed with `npx playwright install chromium`).
