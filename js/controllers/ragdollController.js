// Controller: runs the ragdoll loop and turns pointer input into model actions.
(function(CV){
  function RagdollController(model,view){
    var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,lastX=null,lastY=null;

    function frame(){model.step();view.draw(model);if(!reduce)requestAnimationFrame(frame)}
    function refresh(steps){for(var i=0;i<steps;i++)model.step();view.draw(model)}
    function resize(){var s=view.resize();model.resize(s.w,s.h)}

    function down(e){
      var l=view.local(e);
      if(!model.grab(l[0],l[1]))return;
      lastX=lastY=null;
      view.capture(e.pointerId);view.cursor('grabbing');
      if(reduce)refresh(1);
    }
    function up(){if(model.isDragging()){model.release();view.cursor('')}}
    // hovering pushes nearby joints in the direction the pointer moves
    function move(e){
      var l=view.local(e),x=l[0],y=l[1];
      if(model.isDragging()){model.dragTo(x,y);if(reduce)refresh(1);return}
      if(lastX!==null){model.push(x,y,x-lastX,y-lastY);if(reduce)refresh(60)}
      lastX=x;lastY=y;
    }

    var c=view.canvas;
    c.addEventListener('pointerdown',down);c.addEventListener('pointermove',move);
    c.addEventListener('pointerup',up);c.addEventListener('pointercancel',up);
    c.addEventListener('pointerleave',function(){lastX=lastY=null});
    window.addEventListener('resize',function(){resize();view.draw(model)});

    this.start=function(){resize();frame()};
  }
  CV.RagdollController=RagdollController;
})(window.CV=window.CV||{});
