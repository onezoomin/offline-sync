export default function InitializingServiceWorker () {
  /* Only register a service worker if it's supported */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('serviceWorker.js').then((registration) => {
        console.log('Worker registration successful', registration.scope)
      }, (err) => {
        console.log('Worker registration failed', err)
      }).catch((err) => {
        console.log(err)
      })
    })
  } else {
    console.log('Service Worker is not supported by browser.')
  }

  /**
   * Warn the page must be served over HTTPS
   * The `beforeinstallprompt` event won't fire if the page is served over HTTP.
   * Installability requires a service worker with a fetch event handler, and
   * if the page isn't served over HTTPS, the service worker won't load.
   */
  // if (window.location.protocol === 'http:') {
  //   const requireHTTPS = document.getElementById('requireHTTPS')!!;
  //   const link = requireHTTPS.querySelector('a')!!;
  //   link.href = window.location.href.replace('http://', 'https://');
  //   requireHTTPS.classList.remove('hidden');
  // }
}
