/* Builds device frames for every <div class="board" data-src="../screens/x.html?state=y">.
   Optional: data-title="Owner" (caption), data-tablet (adds 834x1112),
   data-only="phone" or "desktop" (one frame). Each frame is an iframe at the
   device's real size, CSS-scaled to its column, so the screen's own media
   queries see 390, 834 or 1280. No cross-frame scripting: safe on file://. */
(function () {
  var DEVICES = {
    phone: { w: 390, h: 844, label: 'Phone · 390' },
    tablet: { w: 834, h: 1112, label: 'Tablet · 834' },
    desktop: { w: 1280, h: 800, label: 'Desktop · 1280' }
  };
  var frames = [];

  function fit(f) {
    var scale = Math.min(1, f.box.clientWidth / f.d.w);
    f.iframe.style.transform = 'scale(' + scale + ')';
    f.box.style.height = Math.round(f.d.h * scale) + 'px';
  }

  document.querySelectorAll('.board[data-src]').forEach(function (board) {
    var src = board.dataset.src;
    var kinds = board.dataset.only ? [board.dataset.only] : ['phone'].concat('tablet' in board.dataset ? ['tablet'] : [], ['desktop']);
    if (board.dataset.title) {
      var t = document.createElement('p');
      t.className = 'board__title';
      t.innerHTML = board.dataset.title + ' <span class="mono"></span>';
      t.querySelector('.mono').textContent = src.replace(/^\.\.?\//, '');
      board.appendChild(t);
    }
    var row = document.createElement('div');
    row.className = 'board__frames';
    kinds.forEach(function (k) {
      var d = DEVICES[k];
      var fig = document.createElement('figure');
      fig.className = 'frame frame-' + k;
      var box = document.createElement('div');
      box.className = 'frame__box';
      var iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.width = d.w;
      iframe.height = d.h;
      iframe.loading = 'lazy';
      iframe.title = (board.dataset.title || src) + ', ' + d.label;
      box.appendChild(iframe);
      var cap = document.createElement('figcaption');
      cap.innerHTML = '<span>' + d.label + '</span><a target="_blank">Open full size ↗</a>';
      cap.querySelector('a').href = src;
      fig.appendChild(box);
      fig.appendChild(cap);
      row.appendChild(fig);
      frames.push({ box: box, iframe: iframe, d: d });
    });
    board.appendChild(row);
  });

  frames.forEach(fit);
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(function () { frames.forEach(fit); });
    frames.forEach(function (f) { ro.observe(f.box); });
  } else {
    window.addEventListener('resize', function () { frames.forEach(fit); });
  }
})();
