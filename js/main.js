/**
 * @file Entry point: wires models, views and controllers together.
 *
 * Loaded last, after every other script, at the end of `<body>`, so the DOM
 * and the whole `CV` namespace are ready. See docs/ARCHITECTURE.md.
 */
(function(CV){
  // one popup, shared by every link and carousel
  var dialog=new CV.DialogController(new CV.DialogView());

  // every `.car` placeholder in the markup becomes a carousel
  [].forEach.call(document.querySelectorAll('.car'),function(el){new CV.CarouselController(el,dialog)});

  // the interactive stick figure in the hero heading
  new CV.RagdollController(new CV.Ragdoll(),new CV.RagdollView(document.getElementById('ik'))).start();
})(window.CV);
