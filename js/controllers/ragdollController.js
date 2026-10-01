/**
 * @file Controller: runs the ragdoll loop and turns pointer input into model actions.
 *
 * Input (Pointer Events, so mouse, touch and pen behave the same):
 * - Press on or near a joint to grab it and drag the figure around.
 * - Move the pointer across the figure without pressing to push it.
 *
 * Reduced motion: when the user prefers reduced motion there is no animation
 * loop. The idle pose is drawn once, and the simulation only advances in
 * response to input (1 step per drag event, 60 steps per push, so a push
 * shows its end result immediately instead of animating).
 */
(function(CV){
  /**
   * @constructor
   * @param {CV.Ragdoll} model
   * @param {CV.RagdollView} view
   */
  function RagdollController(model,view){
    // lastX/lastY: previous pointer position while hovering, null after leaving or grabbing
    var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,lastX=null,lastY=null;

    /** Animation loop: one simulation step and one draw per display frame. */
    function frame(){model.step();view.draw(model);if(!reduce)requestAnimationFrame(frame)}
    /** Reduced-motion fallback: run several steps at once, then draw. */
    function refresh(steps){for(var i=0;i<steps;i++)model.step();view.draw(model)}
    /** Sync the canvas resolution and the model's box with the CSS size. */
    function resize(){var s=view.resize();model.resize(s.w,s.h)}

    /** Pointer down: grab the nearest joint, if any is close enough. */
    function down(e){
      var l=view.local(e);
      if(!model.grab(l[0],l[1]))return;
      lastX=lastY=null;
      view.capture(e.pointerId);view.cursor('grabbing');
      if(reduce)refresh(1);
    }
    /** Pointer up or cancelled: drop the joint. */
    function up(){if(model.isDragging()){model.release();view.cursor('')}}
    // hovering pushes nearby joints in the direction the pointer moves
    /** Pointer move: drag the grabbed joint, or push the figure. */
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
    // the canvas is sized in em/vw units, so it changes with the window
    window.addEventListener('resize',function(){resize();view.draw(model)});

    /** Size the canvas and start the loop (or draw once with reduced motion). */
    this.start=function(){resize();frame()};
  }
  CV.RagdollController=RagdollController;
})(window.CV=window.CV||{});
