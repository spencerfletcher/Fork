/* Screen states for the decision pack. Load in <head> with defer:
     <script src="../assets/state.js" defer></script>
   ?state=owner      -> <body data-state="owner">   (else the body's own default)
   ?variant=b        -> <body data-variant="b">
   ?clean=1          -> <body class="clean">, hides .annot for screenshots
   Elements with data-state-in="owner visitor" show only in those states;
   data-variant-in="a b" the same for variants. Anything else styles off
   body[data-state=...] in the page's own CSS. No network, works on file://. */
(function () {
  var params = new URLSearchParams(location.search);
  var body = document.body;
  if (params.get('state')) body.dataset.state = params.get('state');
  if (params.get('variant')) body.dataset.variant = params.get('variant');
  if (params.get('clean') === '1') body.classList.add('clean');

  function apply(attr, value) {
    document.querySelectorAll('[' + attr + ']').forEach(function (el) {
      el.hidden = el.getAttribute(attr).split(/\s+/).indexOf(value || '') === -1;
    });
  }
  apply('data-state-in', body.dataset.state);
  apply('data-variant-in', body.dataset.variant);
})();
