'use strict';
(() => {
  const report = (state, message) => {
    document.documentElement.dataset.pwaState = state;
    window.dispatchEvent(new CustomEvent('pwa-state', {detail: {state, message}}));
  };
  if (!/^https?:$/.test(location.protocol) || !window.isSecureContext || !('serviceWorker' in navigator)) {
    report('unavailable', '오프라인 준비를 하려면 HTTPS 게임 주소로 열어 주세요.');
    return;
  }
  report('loading', '인터넷 없이도 놀 수 있도록 준비하고 있어요.');
  navigator.serviceWorker.register(new URL('./sw.js', document.baseURI).href, {
    scope: './', updateViaCache: 'none'
  }).then(registration => {
    const ready = () => report('ready', registration.waiting
      ? '새 버전이 준비됐어요. 열려 있는 게임 창을 모두 닫고 다시 열면 적용돼요.'
      : '오프라인 준비 완료! 인터넷 없이도 놀 수 있어요.');
    const watch = worker => {
      if (!worker) return;
      const changed = () => {
        if (worker.state === 'activated') ready();
        else if (worker.state === 'installed' && registration.active) ready();
        else if (worker.state === 'redundant' && !registration.active) {
          report('error', '준비가 끝나지 않았어요. 인터넷 연결을 확인하고 다시 열어 주세요.');
        }
      };
      worker.addEventListener('statechange', changed);
      changed();
    };
    if (registration.active) ready();
    watch(registration.installing);
    registration.addEventListener('updatefound', () => watch(registration.installing));
    window.addEventListener('online', () => registration.update().catch(() => {}));
  }).catch(() => report('error', '오프라인 준비를 완료하지 못했어요. 연결과 배포 주소를 확인해 주세요.'));
})();
