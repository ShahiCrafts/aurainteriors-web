# AR Experience — "View in Your Room"

Product pages offer an AR preview that places the furniture, true to scale,
in the customer's room. It is powered by **`reticlexr`**, a Capacitor plugin
maintained alongside this project (npm package `reticlexr`), behind one
JavaScript facade whose native plugin name is `ARCore` on both platforms.

## Paths by platform

| Platform | Path | Technology |
| --- | --- | --- |
| Android (Chrome / WebView app) | In-page AR session | WebXR / ARCore via `reticlexr` |
| iOS native app | In-page AR session | ARKit session + RealityKit placement via `reticlexr`'s Swift plugin |
| iOS Safari (no app) | Quick Look | `rel="ar"` link to a `.usdz` model |

Routes: `/ar/:productSlug` is the dedicated AR view; `/native-ar` is the
native-app entry. `VITE_APP_URL` is used to build shareable AR links/QR
codes.

## Model formats — the one rule that matters

- Android/WebXR consumes **GLB**.
- iOS consumes **USDZ only**. The facade maps a GLB path to its sibling
  `.usdz` file (or takes an explicit `usdzPath` / `usdzUrl`); if no USDZ
  exists it rejects with a coded `MODEL_FORMAT_UNSUPPORTED` error rather
  than failing silently.
- The demo sofa's USDZ is generated at build time from its GLB by a
  dependency-free converter (`scripts/glb-to-usdz.mjs` in the reticlexr
  website pipeline), and served from the storefront at `/models/sofa.usdz`.

## iOS overlay mode

`startSession({ overlay: true })` (reticlexr 1.3+) places the native AR view
*below* a transparent web view, so the storefront's own UI — price,
customisation, Add to Cart — floats over the camera feed. In overlay mode,
placement and manipulation are driven from JavaScript (`hitTest`,
`placeModel`, `setTransform`, `setMaterial`); RealityKit gestures are
disabled by design.

## Product data requirements

A product is AR-ready when it has a 3D model attached (GLB, plus USDZ for
iOS) with correct real-world scale in metres. Products without models
simply don't show the AR action — nothing breaks.

## Status & limits

- Android ARCore and the iOS Swift plugin are implemented in the package;
  the Swift code must be compiled on a Mac (Xcode) and device-tested before
  an app release — there is no way to verify RealityKit behaviour from CI.
- Quick Look depends on the device accepting the generated USDZ; validate
  new model pipelines on a physical iPhone.
