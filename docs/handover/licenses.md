# Licenses & Third-Party Software

Aura Interiors is built on open-source software. Direct dependencies of
each codebase are listed below with the version in the lockfile and their
license (extracted from `package-lock.json`). All listed licenses are
permissive (MIT / ISC / BSD / Apache-2.0) and allow commercial use,
including resale of a product built on them, with attribution retained in
the packages themselves. Transitive dependencies ship under their own
respective licenses inside `node_modules`.

## Web — `aurainteriors-web` (storefront, admin, docs site)

| Package | Version | License |
| --- | --- | --- |
| react, react-dom | 19.2.1 | MIT |
| react-router-dom | 7.18.5 | MIT |
| @tanstack/react-query | 5.105.0 | MIT |
| zustand | 5.0.16 | MIT |
| axios | 1.21.0 | MIT |
| tailwindcss, @tailwindcss/vite | 4.3.3 | MIT |
| framer-motion | 12.43.0 | MIT |
| lucide-react | 0.555.0 | ISC |
| react-hook-form, @hookform/resolvers | 7.91.0 / 5.9.2 | MIT |
| yup | 1.7.1 | MIT |
| recharts | 3.10.1 | MIT |
| three | 0.180.0 | MIT |
| reticlexr | 1.1.0 (npm build; source repo carries newer versions) | MIT |
| @capacitor/core | 8.6.0 | MIT |
| socket.io-client | 4.8.4 | MIT |
| lottie-web | 5.13.0 | MIT |
| exceljs | 4.4.0 | MIT |
| qrcode.react | 4.2.0 | ISC |
| react-markdown, remark-gfm | 10.1.0 / 4.0.1 | MIT |
| web-vitals | 6.2.3 | Apache-2.0 |
| vite, @vitejs/plugin-react (build tooling) | 7.3.7 / 5.2.0 | MIT |
| vitest + Testing Library (test tooling) | — | MIT |

## Server — `aurainteriors-server` (API)

| Package | Version | License |
| --- | --- | --- |
| express | 5.3.0 | MIT |
| mongoose | 9.11.4 | MIT |
| socket.io, @socket.io/mongo-adapter | 4.8.4 / 0.4.0 | MIT |
| passport, passport-google-oauth20 | 0.7.0 / 2.0.0 | MIT |
| jsonwebtoken | 9.0.3 | MIT |
| bcrypt | 6.0.0 | MIT |
| joi | 18.3.1 | BSD-3-Clause |
| helmet | 8.3.0 | MIT |
| cors | 2.8.6 | MIT |
| express-rate-limit | 8.7.1 | MIT |
| cloudinary | 2.11.0 | MIT |
| multer | 2.5.0 | MIT |
| sharp | 0.35.5 | Apache-2.0 |
| pdf-parse | 2.4.5 | Apache-2.0 |
| @qdrant/js-client-rest | 1.20.0 | Apache-2.0 |
| compression, cookie-parser, morgan, validator, @xmldom/xmldom | — | MIT |
| dotenv | 17.4.2 | BSD-2-Clause |
| jszip | 3.10.2 | MIT OR GPL-3.0-or-later (used under MIT) |

## Other third-party assets & services

| Item | Terms |
| --- | --- |
| DM Sans font (Google Fonts) | SIL Open Font License 1.1 — free for commercial use |
| Lottie animations / splash assets | As bundled in `public/`; verify individual asset provenance before rebranding them as your own |
| Product imagery in the demo catalogue | Seed/demo imagery for demonstration only — a trading store must replace it with licensed or owned photography |
| Cloudinary, Brevo, eSewa, Google, Qdrant, Groq, Mistral, OpenRouter | External services under their own Terms of Service; accounts and billing belong to the operator, not to this codebase |
| MongoDB, Node.js, nginx, Docker | Open-source under their respective licenses (SSPL for MongoDB server itself; the app only uses the driver/client libraries, MIT/Apache-2.0) |

> This page is a good-faith inventory for handover, not legal advice. For a
> formal sale, have the buyer confirm the list against the lockfiles, which
> are the machine-readable source of truth.
