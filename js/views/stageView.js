// View: the browser window as a stage for the ragdoll once it has broken out of the pill:
// a fixed full-window canvas plus an invisible box that follows the figure and catches the pointer.
(function(CV){
  function StageView(){
    var canvas=document.createElement('canvas'),hit=document.createElement('div');
    canvas.className='stage';canvas.setAttribute('aria-hidden','true');
    hit.className='stage-hit';hit.setAttribute('role','img');
    hit.setAttribute('aria-label','Stick figure. Push it or drag it around the window.');
    document.body.appendChild(canvas);document.body.appendChild(hit);
    this.hit=hit;
    this.view=new CV.RagdollView(canvas,hit);
  }
  var V=StageView.prototype;

  V.resize=function(){return this.view.resize()};

  // move the pointer-catching box over the figure's bounding box
  V.place=function(model){
    var x0=1e9,y0=1e9,x1=-1e9,y1=-1e9,pad=model.S*.12,st=this.hit.style;
    model.points.forEach(function(p){x0=Math.min(x0,p.x);y0=Math.min(y0,p.y);x1=Math.max(x1,p.x);y1=Math.max(y1,p.y)});
    st.transform='translate('+(x0-pad)+'px,'+(y0-pad)+'px)';
    st.width=(x1-x0+2*pad)+'px';st.height=(y1-y0+2*pad)+'px';
  };

  CV.StageView=StageView;
})(window.CV=window.CV||{});
