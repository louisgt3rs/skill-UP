if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.onerror = function (msg, source, line, col, error) {
    document.body.style.cssText =
      'margin:0;padding:24px;background:#0a0a0a;color:#ff4444;font-family:monospace;font-size:14px;overflow:auto;white-space:pre-wrap';
    document.body.innerHTML =
      '<b style="font-size:18px">SKILLUP ERROR</b>\n\n' +
      String(msg).replace(/</g, '&lt;') +
      '\n\n<span style="color:#aaa">at ' + source + ':' + line + '</span>' +
      '\n\n<span style="color:#ffaaaa">' +
      (error && error.stack ? String(error.stack).replace(/</g, '&lt;') : '') +
      '</span>';
    return true;
  };
  window.addEventListener('unhandledrejection', function (e) {
    document.body.style.cssText =
      'margin:0;padding:24px;background:#0a0a0a;color:#ff4444;font-family:monospace;font-size:14px;overflow:auto;white-space:pre-wrap';
    document.body.innerHTML =
      '<b style="font-size:18px">PROMISE ERROR</b>\n\n' +
      String(e.reason).replace(/</g, '&lt;');
  });
}
