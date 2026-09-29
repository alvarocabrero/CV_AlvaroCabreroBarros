// Model: ragdoll stick figure (verlet physics + idle/wave/get-up state). No DOM access.
(function(CV){
  // joints: 0 head, 1 neck, 2 hip, 3/4 L elbow/hand, 5/6 R elbow/hand, 7/8 L knee/foot, 9/10 R knee/foot
  // bones [a,b,length/H,stiffness]
  var BONES=[[0,1,.13,1],[1,2,.28,1],[1,3,.15,1],[3,4,.15,1],[1,5,.15,1],[5,6,.15,1],[2,7,.19,1],[7,8,.19,1],[2,9,.19,1],[9,10,.19,1],[0,2,.41,.12],[7,9,.15,.03]];
  // relaxed idle pose (slightly slouched, arms hanging, weight on one leg), offsets from the box centre in H units (feet on the floor)
  var IDLE=[[.015,-.31],[.004,-.18],[-.01,.1],[-.085,-.055],[-.1,.093],[.085,-.055],[.115,.09],[-.0853,.2745],[-.085,.4645],[.0634,.2753],[.08,.4645]];

  // rotation limits so the figure keeps its shape when pushed. Each entry is the angle of a child
  // bone (c0->c1) against its parent bone (p0->p1, both meeting at p1==c0): [p0,p1,c0,c1,min,max,mode]
  // mode 'r': limits are relative to the rest (idle) angle, 'a': absolute (elbows and knees bend one way)
  var LIMITS=[
    [2,1,1,0,-.45,.45,'r'],   // neck
    [2,1,1,3,-1.5,1.5,'r'],   // left shoulder
    [2,1,1,5,-1.5,1.5,'r'],   // right shoulder
    [1,3,3,4,-1.9,.05,'a'],   // left elbow
    [1,5,5,6,-.05,1.9,'a'],  // right elbow
    [1,2,2,7,-.65,.65,'r'],    // left hip
    [1,2,2,9,-.65,.65,'r'],    // right hip
    [2,7,7,8,-1.1,.05,'a'],   // left knee
    [2,9,9,10,-.05,1.1,'a']   // right knee
  ];
  function wrap(d){while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d}
  function jointAngle(P,l){
    var A=P[l[0]],J=P[l[1]],C0=P[l[2]],C=P[l[3]];
    return wrap(Math.atan2(C.y-C0.y,C.x-C0.x)-Math.atan2(J.y-A.y,J.x-A.x));
  }
  var REST=LIMITS.map(function(l){var P=IDLE.map(function(v){return{x:v[0],y:v[1]}});return jointAngle(P,l)});
  function rotate(p,o,th){var x=p.x-o.x,y=p.y-o.y,c=Math.cos(th),s=Math.sin(th);p.x=o.x+x*c-y*s;p.y=o.y+x*s+y*c}
  // keep the left leg on the left of the torso and the right leg on the right
  // (measured across the spine, so it works whatever the body orientation); corrections are capped so a
  // tangled pair is pulled apart smoothly instead of snapping past each other
  function uncrossLegs(P,S){
    var hip=P[2],ux=P[1].x-hip.x,uy=P[1].y-hip.y,len=Math.hypot(ux,uy);
    if(len<S*.05)return;
    var nx=-uy/len,ny=ux/len;
    [[7,9,.04],[8,10,.05]].forEach(function(pr){
      var L=P[pr[0]],Rt=P[pr[1]],sL=(L.x-hip.x)*nx+(L.y-hip.y)*ny,sR=(Rt.x-hip.x)*nx+(Rt.y-hip.y)*ny,diff=Math.max(sR-sL-pr[2]*S,-S*.008);
      if(diff<0){L.x+=nx*diff/2;L.y+=ny*diff/2;Rt.x-=nx*diff/2;Rt.y-=ny*diff/2}
    });
  }
  // rotate the child bone (mostly) and the parent bone (a little) back inside the allowed range
  function limitJoints(P){
    for(var k=0;k<LIMITS.length;k++){
      var l=LIMITS[k],rel=wrap(jointAngle(P,l)-(l[6]==='r'?REST[k]:0)),cl=Math.max(l[4],Math.min(l[5],rel));
      if(cl===rel)continue;
      var d=cl-rel;
      rotate(P[l[3]],P[l[2]],d*.7);
      rotate(P[l[0]],P[l[1]],-d*.3);
    }
  }

  function smooth(u){u=Math.max(0,Math.min(1,u));return u*u*(3-2*u)}

  function Ragdoll(){
    this.W=0;this.H=0;
    this.S=0;        // figure scale (the height of the pill it starts in); bone lengths and sizes derive from it
    this.box=false;  // false: inside the pill, true: free in the browser window
    this.points=IDLE.map(function(){return{x:0,y:0,px:0,py:0}});
    this.idle=true;this.drag=-1;this.gx=0;this.gy=0;
    this.t=0;this.still=0;this.rising=false;this.riseT=0;
  }
  var R=Ragdoll.prototype;
  Ragdoll.BONES=BONES;

  R.resize=function(w,h){
    var ow=this.W,oh=this.H,self=this;this.W=w;this.H=h;
    if(this.box){this.points.forEach(function(p){self.fit(p,self.S*.03)});return}
    this.S=h;
    if(this.idle)this.pose();
    else if(ow&&oh)this.points.forEach(function(p){p.x*=w/ow;p.y*=h/oh;p.px*=w/ow;p.py*=h/oh});
  };

  // relaxed waiting motion (breathing, weight shift, glancing, an occasional foot tap),
  // then a periodic wave: arm rises with a little overshoot, forearm swings around the
  // elbow, head and torso follow
  R.pose=function(){
    var t=this.t,W=this.W,H=this.H,S=this.S,START=4,ph=(t-START)%7,D=2.8,on=t>=START&&ph<D,e=0,we=0,a=0,f=t*11;
    if(on){
      // ease in from rest (no sudden start), small overshoot, hold, ease out
      if(ph<.72){var x1=Math.min(1,ph/.42),x2=Math.max(0,Math.min(1,(ph-.42)/.3));e=smooth(x1)+.1*Math.pow(Math.sin(Math.PI*x2),2)}else e=smooth((D-ph)/.5);
      we=smooth((ph-.35)/.3)*smooth((D-.1-ph)/.4);a=Math.sin(f)*.65*we}
    var br=Math.sin(t*1.8)*.004,sw=Math.sin(t*.7)*.008,gl=Math.sin(t*.45)*.012,ft=t%4.5,tap=ft>2.6&&ft<3.6?Math.max(0,Math.sin((ft-2.6)*Math.PI*3))*.022:0;
    this.points.forEach(function(p,i){
      var x=IDLE[i][0],y=IDLE[i][1];
      if(i===0){x+=sw*1.3+gl;y+=br}
      else if(i===1){x+=sw;y+=br}
      else if(i===2)x-=sw*.3;
      else if(i<7){x+=sw+((i===4||i===6)?Math.sin(t*1.1+i)*.005:0);y+=br}
      else if(i===9)y-=tap*.5;
      else if(i===10)y-=tap;
      if(i===0){x+=-e*.075+Math.sin(f)*.012*we;y+=.012*e-Math.abs(Math.sin(f))*.006*we}
      else if(i===1)x-=e*.03;
      else if(i===3||i===4){x-=e*.015*(i-2);y+=Math.sin(f+3)*.008*we}
      else if(i===5||i===6){
        var ex=.115+Math.sin(f)*.012*we,ey=-.286,hx=ex+.15*Math.sin(a),hy=ey-.15*Math.cos(a),tx=i===5?ex:hx,ty=i===5?ey:hy;
        x+=(tx-x)*e;y+=(ty-y)*e}
      p.x=W*.5+x*S;p.y=H*.5+y*S;p.px=p.x;p.py=p.y});
  };

  // keep a point inside its world: the pill (stadium) shape, or the browser window where it bounces
  R.fit=function(p,m){
    var W=this.W,H=this.H;
    if(this.box){
      var vx=p.x-p.px,vy=p.y-p.py;
      if(p.x<m){p.x=m;p.px=vx<0?m+vx*.3:m-vx}
      else if(p.x>W-m){p.x=W-m;p.px=vx>0?p.x+vx*.3:p.x-vx}
      if(p.y<m){p.y=m;p.py=vy<0?m+vy*.25:m-vy}
      else if(p.y>H-m){p.y=H-m;p.py=vy>0?p.y+vy*.15:p.y-vy;p.px=p.x-(p.x-p.px)*.85}
      return;
    }
    var r=H/2,cx=Math.max(r,Math.min(W-r,p.x)),dx=p.x-cx,dy=p.y-r,d=Math.hypot(dx,dy),lim=r-m;
    if(d>lim&&d>0){p.x=cx+dx*lim/d;p.y=r+dy*lim/d;if(dy>0){p.px=p.x-(p.x-p.px)*.75;p.py=p.y-(p.y-p.py)*.6}}
  };

  // once at rest, pull the joints back to the standing pose (feet first, head last), then restart the idle loop
  R.rise=function(){
    var W=this.W,H=this.H,S=this.S,ok=true;this.riseT+=.016;
    for(var i=0;i<this.points.length;i++){
      var p=this.points[i],tx=W*.5+IDLE[i][0]*S,ty=H*.5+IDLE[i][1]*S,dl=i>2?(i>6?0:.5):(i?.4:.9),k=Math.max(0,Math.min(.14,(this.riseT-dl)*.14));
      p.x+=(tx-p.x)*k;p.y+=(ty-p.y)*k;p.px=p.x-(p.x-p.px)*.6;p.py=p.y-(p.y-p.py)*.6;
      if(Math.hypot(tx-p.x,ty-p.y)>S*.015)ok=false;
    }
    if(ok&&this.riseT>1.5||this.riseT>5){this.idle=true;this.rising=false;this.still=0;this.t=0;this.pose()}
  };

  R.step=function(){
    if(this.idle){this.t+=.016;this.pose();return}
    var P=this.points,S=this.S,gr=S*.004*(this.rising?Math.max(0,1-this.riseT/1.5):1),i,j;
    var vmax=S*.12;
    for(i=0;i<P.length;i++){
      var p=P[i],vx=(p.x-p.px)*.995,vy=(p.y-p.py)*.995,sp=Math.hypot(vx,vy);
      if(this.box&&sp>vmax){vx*=vmax/sp;vy*=vmax/sp} // free in the window: no runaway speeds
      p.px=p.x;p.py=p.y;p.x+=vx;p.y+=vy+gr;
    }
    for(j=0;j<8;j++){
      // the grabbed joint is pulled towards the pointer first, so bones and joint limits keep the last word
      if(this.drag>=0){var q=P[this.drag];q.x+=(this.gx-q.x)*.75;q.y+=(this.gy-q.y)*.75}
      for(i=0;i<BONES.length;i++){
        var b=BONES[i],A=P[b[0]],C=P[b[1]],dx=C.x-A.x,dy=C.y-A.y,d=Math.hypot(dx,dy)||.001,f=(d-b[2]*S)/d*.5*b[3];
        A.x+=dx*f;A.y+=dy*f;C.x-=dx*f;C.y-=dy*f;
      }
      limitJoints(P);limitJoints(P);
      uncrossLegs(P,S);
      for(i=0;i<P.length;i++)this.fit(P[i],i?S*.03:S*.085);
    }
    if(this.drag>=0){this.still=0;this.rising=false}
    else if(this.rising)this.rise();
    else if(!this.box){
      var m=0;P.forEach(function(p){m=Math.max(m,Math.hypot(p.x-p.px,p.y-p.py))});
      this.still=m<S*.004?this.still+1:0;
      if(this.still>90){this.rising=true;this.riseT=0}
    }
  };

  // leave the idle state (and any get-up attempt) as soon as something touches the figure
  R.wake=function(){
    if(this.idle){this.idle=false;this.points.forEach(function(p){p.px=p.x;p.py=p.y})}
    this.rising=false;this.still=0;
  };

  // leave the pill: move to window coordinates (the pill sat at ox,oy), grow by `scale` and fall
  // freely inside a vw x vh window, bouncing off its edges. There is no getting back up from here.
  R.breakOut=function(ox,oy,vw,vh,scale){
    var P=this.points,cx=0,cy=0;
    P.forEach(function(p){cx+=p.x;cy+=p.y});cx/=P.length;cy/=P.length;
    this.wake();
    P.forEach(function(p){
      p.x=ox+cx+(p.x-cx)*scale;p.y=oy+cy+(p.y-cy)*scale;
      p.px=ox+cx+(p.px-cx)*scale;p.py=oy+cy+(p.py-cy)*scale;
    });
    this.S*=scale;this.W=vw;this.H=vh;this.box=true;
  };

  R.nearest=function(x,y){var k=-1,m=this.S*.4;this.points.forEach(function(p,i){var d=Math.hypot(p.x-x,p.y-y);if(d<m){m=d;k=i}});return k};

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
    var S=this.S,cap=S*(this.box?.25:.5),k=this.box?.1:.22,mx=Math.max(-cap,Math.min(cap,dx)),my=Math.max(-cap,Math.min(cap,dy)),r=S*.5;
    if(Math.hypot(mx,my)<=S*.02)return;
    var hit=this.points.filter(function(p){return Math.hypot(p.x-x,p.y-y)<r});
    if(!hit.length)return;
    this.wake();
    hit.forEach(function(p){var w=1-Math.hypot(p.x-x,p.y-y)/r;p.px-=mx*w*k;p.py-=my*w*k});
  };

  CV.Ragdoll=Ragdoll;
})(window.CV=window.CV||{});
