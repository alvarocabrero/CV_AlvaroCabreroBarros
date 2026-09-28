// View: draws the ragdoll on its canvas.
(function(CV){
  function RagdollView(canvas){this.canvas=canvas;this.g=canvas.getContext('2d')}
  var V=RagdollView.prototype;

  // match the canvas resolution to its CSS size; returns the size in CSS pixels
  V.resize=function(){
    var r=this.canvas.getBoundingClientRect(),d=window.devicePixelRatio||1;
    this.canvas.width=r.width*d;this.canvas.height=r.height*d;this.g.setTransform(d,0,0,d,0,0);
    return{w:r.width,h:r.height};
  };

  V.draw=function(model){
    var g=this.g,P=model.points,H=model.H;
    g.clearRect(0,0,model.W,H);g.strokeStyle=g.fillStyle='#fff';g.lineCap='round';g.lineJoin='round';g.lineWidth=H*.055;
    function line(){g.beginPath();g.moveTo(P[arguments[0]].x,P[arguments[0]].y);for(var i=1;i<arguments.length;i++)g.lineTo(P[arguments[i]].x,P[arguments[i]].y);g.stroke()}
    line(1,2);line(4,3,1,5,6);line(8,7,2,9,10);
    g.beginPath();g.arc(P[0].x,P[0].y,H*.085,0,7);g.fill();
  };

  // pointer position relative to the canvas
  V.local=function(e){var r=this.canvas.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
  V.cursor=function(v){this.canvas.style.cursor=v};
  V.capture=function(id){try{this.canvas.setPointerCapture(id)}catch(_){}};

  CV.RagdollView=RagdollView;
})(window.CV=window.CV||{});
