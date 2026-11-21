// Plays the brand loading animation (public/loading.json, from the
// original loading.lottie) inside the first-paint splash. Plain
// same-origin scripts: the CSP allows script-src 'self', and no
// inline script is needed. If anything fails, the splash is plain
// background and is still dismissed/faded by the usual failsafes.
(function () {
  var el = document.getElementById("app-splash-anim");
  if (!el || !window.lottie) return;
  window.lottie.loadAnimation({
    container: el,
    renderer: "svg",
    loop: true,
    autoplay: true,
    path: "/loading.json",
  });
})();
