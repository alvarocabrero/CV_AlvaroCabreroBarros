// Model: ragdoll stick figure (verlet physics + idle/wave/get-up state). No DOM access.
(function(CV){
  // joints: 0 head, 1 neck, 2 hip, 3/4 L elbow/hand, 5/6 R elbow/hand, 7/8 L knee/foot, 9/10 R knee/foot
  // bones [a,b,length/H,stiffness]
  var BONES=[[0,1,.13,1],[1,2,.28,1],[1,3,.15,1],[3,4,.15,1],[1,5,.15,1],[5,6,.15,1],[2,7,.19,1],[7,8,.19,1],[2,9,.19,1],[9,10,.19,1],[0,2,.41,.12],[7,9,.09,.03]];
  // idle pose, offsets from the box centre in H units (feet on the floor)
  var IDLE=[[0,-.32],[0,-.19],[0,.09],[-.125,-.105],[-.14,.045],[.125,-.105],[.14,.045],[-.045,.275],[-.055,.4645],[.045,.275],[.055,.4645]];

  function smooth(u){u=Math.max(0,Math.min(1,u));return u*u*(3-2*u)}

  function Ragdoll(){
    this.W=0;this.H=0;
    this.points=IDLE.map(function(){return{x:0,y:0,px:0,py:0}});
    this.idle=true;this.drag=-1;this.gx=0;this.gy=0;
    this.t=0;this.still=0;this.rising=false;this.riseT=0;
  }
  var R=Ragdoll.prototype;
  Ragdoll.BONES=BONES;

  R.resize=function(w,h){
    var ow=this.W,oh=this.H;this.W=w;this.H=h;
    if(this.idle)this.pose();
    else if(ow&&oh)this.points.forEach(function(p){p.x*=w/ow;p.y*=h/oh;p.px*=w/ow;p.py*=h/oh});
  };

  // standing pose plus the periodic wave: arm rises with a little overshoot,
  // forearm swings around the elbow, head and torso follow
  R.pose=function(){
    var t=this.t,W=this.W,H=this.H,ph=(t-1.5)%5,D=2.8,on=t>=1.5&&ph<D,e=0,we=0,a=0,f=t*11;
    if(on){var u=Math.min(1,ph/.5)-1;e=ph<.5?1+2.2*u*u*u+1.2*u*u:smooth((D-ph)/.5);we=smooth((ph-.35)/.3)*smooth((D-.1-ph)/.4);a=Math.sin(f)*.65*we}
    var s=Math.sin(t*2)*.006;
    this.points.forEach(function(p,i){
      var x=IDLE[i][0],y=IDLE[i][1]+(i<3?0:s);
      if(i===0){x+=-e*.075+Math.sin(f)*.012*we;y+=.012*e-Math.abs(Math.sin(f))*.006*we}
      else if(i===1)x-=e*.03;
      else if(i===3||i===4){x-=e*.015*(i-2);y+=Math.sin(f+3)*.008*we}
      else if(i===5||i===6){
        var ex=.115+Math.sin(f)*.012*we,ey=-.286,hx=ex+.15*Math.sin(a),hy=ey-.15*Math.cos(a),tx=i===5?ex:hx,ty=i===5?ey:hy;
        x+=(tx-x)*e;y+=(ty-y)*e}
      p.x=W*.5+x*H;p.y=H*.5+y*H;p.px=p.x;p.py=p.y});
  };

  // keep a point inside the pill (stadium) shape
  R.fit=function(p,m){
    var W=this.W,H=this.H,r=H/2,cx=Math.max(r,Math.min(W-r,p.x)),dx=p.x-cx,dy=p.y-r,d=Math.hypot(dx,dy),lim=r-m;
    if(d>lim&&d>0){p.x=cx+dx*lim/d;p.y=r+dy*lim/d;if(dy>0){p.px=p.x-(p.x-p.px)*.75;p.py=p.y-(p.y-p.py)*.6}}
  };

  // once at rest, pull the joints back to the standing pose (feet first, head last), then restart the idle loop
  R.rise=function(){
    var W=this.W,H=this.H,ok=true;this.riseT+=.016;
    for(var i=0;i<this.points.length;i++){
      var p=this.points[i],tx=W*.5+IDLE[i][0]*H,ty=H*.5+IDLE[i][1]*H,dl=i>2?(i>6?0:.5):(i?.4:.9),k=Math.max(0,Math.min(.14,(this.riseT-dl)*.14));
      p.x+=(tx-p.x)*k;p.y+=(ty-p.y)*k;p.px=p.x-(p.x-p.px)*.6;p.py=p.y-(p.y-p.py)*.6;
      if(Math.hypot(tx-p.x,ty-p.y)>H*.015)ok=false;
    }
    if(ok&&this.riseT>1.5||this.riseT>5){this.idle=true;this.rising=false;this.still=0;this.t=0;this.pose()}
  };

  R.step=function(){
    if(this.idle){this.t+=.016;this.pose();return}
    var P=this.points,H=this.H,gr=H*.004*(this.rising?Math.max(0,1-this.riseT/1.5):1),i,j;
    for(i=0;i<P.length;i++){var p=P[i],vx=(p.x-p.px)*.995,vy=(p.y-p.py)*.995;p.px=p.x;p.py=p.y;p.x+=vx;p.y+=vy+gr}
    for(j=0;j<8;j++){
      for(i=0;i<BONES.length;i++){
        var b=BONES[i],A=P[b[0]],C=P[b[1]],dx=C.x-A.x,dy=C.y-A.y,d=Math.hypot(dx,dy)||.001,f=(d-b[2]*H)/d*.5*b[3];
        A.x+=dx*f;A.y+=dy*f;C.x-=dx*f;C.y-=dy*f;
      }
      for(i=0;i<P.length;i++)this.fit(P[i],i?H*.03:H*.085);
      if(this.drag>=0){var q=P[this.drag];q.x=this.gx;q.y=this.gy;this.fit(q,this.drag?H*.03:H*.085)}
    }
    if(this.drag>=0){this.still=0;this.rising=false}
    else if(this.rising)this.rise();
    else{
      var m=0;P.forEach(function(p){m=Math.max(m,Math.hypot(p.x-p.px,p.y-p.py))});
      this.still=m<H*.004?this.still+1:0;
      if(this.still>90){this.rising=true;this.riseT=0}
    }
  };

  // leave the idle state (and any get-up attempt) as soon as something touches the figure
  R.wake=function(){
    if(this.idle){this.idle=false;this.points.forEach(function(p){p.px=p.x;p.py=p.y})}
    this.rising=false;this.still=0;
  };

  R.nearest=function(x,y){var k=-1,m=this.H*.4;this.points.forEach(function(p,i){var d=Math.hypot(p.x-x,p.y-y);if(d<m){m=d;k=i}});return k};

  // grab the joint nearest to (x,y); false when nothing is close enough
  R.grab=function(x,y){
    var k=this.nearest(x,y);if(k<0)return false;
    this.wake();this.drag=k;this.gx=x;this.gy=y;return true;
  };
  R.dragTo=function(x,y){this.gx=x;this.gy=y};
  R.release=function(){this.drag=-1};
  R.isDragging=function(){return this.drag>=0};

  // pointer moving by (dx,dy) at (x,y) pushes nearby joints in that direction
  R.push=function(x,y,dx,dy){
    var H=this.H,mx=Math.max(-H*.5,Math.min(H*.5,dx)),my=Math.max(-H*.5,Math.min(H*.5,dy)),r=H*.5;
    if(Math.hypot(mx,my)<=H*.02)return;
    var hit=this.points.filter(function(p){return Math.hypot(p.x-x,p.y-y)<r});
    if(!hit.length)return;
    this.wake();
    hit.forEach(function(p){var w=1-Math.hypot(p.x-x,p.y-y)/r;p.px-=mx*w*.22;p.py-=my*w*.22});
  };

  CV.Ragdoll=Ragdoll;
})(window.CV=window.CV||{});
