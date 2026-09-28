// Entry point: wires models, views and controllers together.
(function(CV){
  var dialog=new CV.DialogController(new CV.DialogView());

  [].forEach.call(document.querySelectorAll('.car'),function(el){new CV.CarouselController(el,dialog)});

  new CV.RagdollController(new CV.Ragdoll(),new CV.RagdollView(document.getElementById('ik'))).start();
})(window.CV);
