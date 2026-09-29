// View: draws the ragdoll (and the fragments of the broken pill) on a canvas.
(function(CV){
  // `target` is the element that receives the pointer events and cursor (defaults to the canvas)
  function RagdollView(canvas,target){this.canvas=canvas;this.target=target||canvas;this.g=canvas.getContext('2d')}
  var V=RagdollView.prototype;

  // match the canvas resolution to its CSS size; returns the size in CSS pixels
  V.resize=function(){
    var r=this.canvas.getBoundingClientRect(),d=window.devicePixelRatio||1;
    this.canvas.width=r.width*d;this.canvas.height=r.height*d;this.g.setTransform(d,0,0,d,0,0);
    return{w:r.width,h:r.height};
  };

  V.clear=function(){this.g.clearRect(0,0,this.canvas.width,this.canvas.height)};

  V.draw=function(model,shards){
    var g=this.g,P=model.points,S=model.S;
    g.clearRect(0,0,model.W,model.H);
    if(shards)this.drawShards(shards);
    g.strokeStyle=g.fillStyle='#fff';g.lineCap='round';g.lineJoin='round';g.lineWidth=S*.055;
    function line(){g.beginPath();g.moveTo(P[arguments[0]].x,P[arguments[0]].y);for(var i=1;i<arguments.length;i++)g.lineTo(P[arguments[i]].x,P[arguments[i]].y);g.stroke()}
    line(1,2);line(4,3,1,5,6);line(8,7,2,9,10);
    g.beginPath();g.arc(P[0].x,P[0].y,S*.085,0,7);g.fill();
  };

  V.drawShards=function(shards){
    var g=this.g;
    g.fillStyle=g.strokeStyle='#6b6863';g.lineWidth=.6;g.lineJoin='round';
    shards.list.forEach(function(s){
      g.save();g.translate(s.x,s.y);g.rotate(s.a);g.globalAlpha=Math.min(1,s.life*1.5);
      g.beginPath();g.moveTo(s.pts[0][0],s.pts[0][1]);g.lineTo(s.pts[1][0],s.pts[1][1]);g.lineTo(s.pts[2][0],s.pts[2][1]);g.closePath();
      g.fill();g.stroke();g.restore();
    });
  };

  // pointer position relative to the canvas
  V.local=function(e){var r=this.canvas.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
  V.cursor=function(v){this.target.style.cursor=v};
  V.capture=function(id){try{this.target.setPointerCapture(id)}catch(_){}};

  CV.RagdollView=RagdollView;
})(window.CV=window.CV||{});
