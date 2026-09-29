// Controller: runs the ragdoll loop and turns pointer input into model actions.
// Clicking the figure breaks the pill: from then on it lives on a full-window stage.
(function(CV){
  function RagdollController(model,view){
    var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,
        lastX=null,lastY=null,press=null,stage=null,shards=null,
        handlers={pointerdown:down,pointermove:move,pointerup:up,pointercancel:up,pointerleave:leave};

    function cur(){return stage?stage.view:view}
    function render(){
      if(stage){
        if(shards){shards.step();if(!shards.alive())shards=null}
        stage.view.draw(model,shards);stage.place(model);
      }else view.draw(model);
    }
    function frame(){model.step();render();if(!reduce)requestAnimationFrame(frame)}
    function refresh(steps){for(var i=0;i<steps;i++)model.step();render()}
    function resize(){var s=cur().resize();model.resize(s.w,s.h)}

    function bind(el,on){for(var k in handlers)el[on?'addEventListener':'removeEventListener'](k,handlers[k])}

    function down(e){
      var v=cur(),l=v.local(e);
      // inside the pill any press may turn out to be a click, wherever it lands
      press=stage?null:{x:l[0],y:l[1],t:Date.now(),moved:false};
      if(!model.grab(l[0],l[1]))return;
      lastX=lastY=null;
      v.capture(e.pointerId);v.cursor('grabbing');
      if(reduce)refresh(1);
    }
    // a single click (no real dragging) shatters the pill
    function up(){
      var p=press;press=null;
      if(model.isDragging()){model.release();cur().cursor('')}
      if(p&&!p.moved&&Date.now()-p.t<800&&!reduce&&!stage)breakOut(p.x,p.y);
    }
    function leave(){lastX=lastY=null;if(!model.isDragging())press=null}
    // hovering pushes nearby joints in the direction the pointer moves
    function move(e){
      var l=cur().local(e),x=l[0],y=l[1];
      if(press&&Math.hypot(x-press.x,y-press.y)>10)press.moved=true;
      if(model.isDragging()){model.dragTo(x,y);if(reduce)refresh(1);return}
      if(lastX!==null){model.push(x,y,x-lastX,y-lastY);if(reduce)refresh(60)}
      lastX=x;lastY=y;
    }

    // a click shatters the pill; the figure grows a little and falls to the bottom of the window
    function breakOut(cx,cy){
      var r=view.canvas.getBoundingClientRect(),pill=view.canvas.parentNode;
      stage=new CV.StageView();
      var s=stage.resize();
      model.breakOut(r.left,r.top,s.w,s.h,1.5);
      shards=new CV.Shards({x:r.left,y:r.top,w:r.width,h:r.height},r.left+cx,r.top+cy);
      bind(view.canvas,false);view.clear();pill.classList.add('broken');
      bind(stage.hit,true);
      lastX=lastY=null;
    }

    bind(view.canvas,true);
    window.addEventListener('resize',function(){resize();render()});

    this.start=function(){resize();frame()};
  }
  CV.RagdollController=RagdollController;
})(window.CV=window.CV||{});
