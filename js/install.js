if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('./sw.js').catch(error => {
    console.warn('PLAY JAM offline setup:', error);
  });
}
