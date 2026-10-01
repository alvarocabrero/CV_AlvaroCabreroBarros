/**
 * @file Model: ragdoll stick figure (verlet physics + idle/wave/get-up state). No DOM access.
 *
 * The figure lives inside a pill-shaped (stadium) box of size W×H, in CSS pixels.
 * Every length is expressed as a fraction of H, so the figure scales with the box.
 *
 * Lifecycle, driven by {@link Ragdoll#step} once per animation frame (~60 fps):
 *
 *   idle ──(pointer pushes or grabs it)──► physics ──(at rest ~1.5 s)──► rising
 *     ▲                                       ▲                             │
 *     │                                       └─────(touched again)─────────┤
 *     └──────────────(back in the standing pose)────────────────────────────┘
 *
 * - idle:    joints are placed procedurally by {@link Ragdoll#pose} (standing,
 *            with a periodic wave). No physics runs.
 * - physics: verlet integration with gravity, distance constraints between
 *            joints ("bones") and collision against the pill outline.
 * - rising:  still physics, but gravity fades out while every joint is pulled
 *            back to the standing pose, feet first and head last.
 *
 * Time is counted in fixed steps of 0.016 s rather than measured, so the
 * simulation is deterministic and runs at the display's frame rate.
 */
(function(CV){
  // joints: 0 head, 1 neck, 2 hip, 3/4 L elbow/hand, 5/6 R elbow/hand, 7/8 L knee/foot, 9/10 R knee/foot
  // bones [a,b,length/H,stiffness]
  //
  // Stiffness is the fraction of the length error corrected per solver pass:
  // 1 = rigid bone. The last two entries are soft helper constraints, not
  // drawn: head–hip (0.12) keeps the torso from folding in half, and
  // knee–knee (0.03) gently keeps the legs from crossing.
  var BONES=[
    [0,1,.13,1],              // head – neck
    [1,2,.28,1],              // neck – hip (spine)
    [1,3,.15,1],[3,4,.15,1],  // left upper arm, forearm
    [1,5,.15,1],[5,6,.15,1],  // right upper arm, forearm
    [2,7,.19,1],[7,8,.19,1],  // left thigh, shin
    [2,9,.19,1],[9,10,.19,1], // right thigh, shin
    [0,2,.41,.12],            // soft: head – hip
    [7,9,.09,.03]             // soft: knee – knee
  ];
  // idle pose, offsets from the box centre in H units (feet on the floor)
  // x grows to the right, y grows downwards (canvas convention).
  var IDLE=[[0,-.32],[0,-.19],[0,.09],[-.125,-.105],[-.14,.045],[.125,-.105],[.14,.045],[-.045,.275],[-.055,.4645],[.045,.275],[.055,.4645]];

  /**
   * Smoothstep easing: clamps u to [0,1] and eases in and out.
   * @param {number} u
   * @returns {number} Value in [0,1].
   */
  function smooth(u){u=Math.max(0,Math.min(1,u));return u*u*(3-2*u)}

  /**
   * A stick figure made of 11 joints connected by bones.
   * Call {@link Ragdoll#resize} before the first {@link Ragdoll#step}.
   * @constructor
   */
  function Ragdoll(){
    /** Box width and height in CSS pixels. */
    this.W=0;this.H=0;
    /**
     * Joint positions. `x,y` is the current position and `px,py` the previous
     * one; their difference is the joint's velocity (verlet integration).
     * @type {{x:number,y:number,px:number,py:number}[]}
     */
    this.points=IDLE.map(function(){return{x:0,y:0,px:0,py:0}});
    // idle: posed procedurally; drag: index of the grabbed joint or -1;
    // gx,gy: where the grabbed joint is being dragged to
    this.idle=true;this.drag=-1;this.gx=0;this.gy=0;
    // t: idle clock in seconds; still: consecutive frames at rest;
    // rising/riseT: get-up animation flag and its clock in seconds
    this.t=0;this.still=0;this.rising=false;this.riseT=0;
  }
  var R=Ragdoll.prototype;

  /**
   * Set the box size. While idle the pose is rebuilt at the new size;
   * otherwise joints are scaled proportionally so the simulation keeps going.
   * @param {number} w Width in CSS pixels.
   * @param {number} h Height in CSS pixels.
   */
  R.resize=function(w,h){
    var ow=this.W,oh=this.H;this.W=w;this.H=h;
    if(this.idle)this.pose();
    else if(ow&&oh)this.points.forEach(function(p){p.x*=w/ow;p.y*=h/oh;p.px*=w/ow;p.py*=h/oh});
  };

  // standing pose plus the periodic wave: arm rises with a little overshoot,
  // forearm swings around the elbow, head and torso follow
  /**
   * Place every joint for the idle animation at time `this.t`.
   *
   * Timeline: the first wave starts at 1.5 s and repeats every 5 s, lasting
   * D = 2.8 s. Within a wave:
   * - `e` (0→1): how far the right arm is raised. It rises in 0.5 s with a
   *   small overshoot (cubic ease), holds, and lowers over the last 0.5 s.
   * - `we` (0→1): how much the forearm swings, faded in and out inside the wave.
   * - `a`: forearm angle around the elbow, ±0.65 rad at f = 11 rad/s (~1.75 Hz).
   * The head leans away from the raised arm and the neck follows slightly.
   * Arms and legs also bob gently all the time (`s`), so the figure never
   * looks frozen.
   *
   * Velocities are zeroed (`px=x`), so switching to physics starts at rest.
   */
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
        // raised right arm: elbow (ex,ey) above the shoulder, hand (hx,hy) one
        // forearm length from it at angle a; blend from the idle pose by e
        var ex=.115+Math.sin(f)*.012*we,ey=-.286,hx=ex+.15*Math.sin(a),hy=ey-.15*Math.cos(a),tx=i===5?ex:hx,ty=i===5?ey:hy;
        x+=(tx-x)*e;y+=(ty-y)*e}
      p.x=W*.5+x*H;p.y=H*.5+y*H;p.px=p.x;p.py=p.y});
  };

  // keep a point inside the pill (stadium) shape
  /**
   * Project a joint back inside the pill outline, shrunk by margin `m`.
   *
   * The stadium is the set of points within r = H/2 of the horizontal segment
   * from (r, r) to (W−r, r). The joint is pushed back to that distance (minus
   * `m`) from its closest point on the segment. When it hits the lower half
   * (the floor), its velocity is damped (75% kept sideways, 60% vertically)
   * so the figure settles instead of bouncing forever.
   * @param {{x:number,y:number,px:number,py:number}} p Joint to constrain (mutated).
   * @param {number} m Margin in pixels, e.g. the head radius for the head.
   */
  R.fit=function(p,m){
    var W=this.W,H=this.H,r=H/2,cx=Math.max(r,Math.min(W-r,p.x)),dx=p.x-cx,dy=p.y-r,d=Math.hypot(dx,dy),lim=r-m;
    if(d>lim&&d>0){p.x=cx+dx*lim/d;p.y=r+dy*lim/d;if(dy>0){p.px=p.x-(p.x-p.px)*.75;p.py=p.y-(p.y-p.py)*.6}}
  };

  // once at rest, pull the joints back to the standing pose (feet first, head last), then restart the idle loop
  /**
   * One frame of the get-up animation.
   *
   * Each joint is pulled towards its standing position by a fraction of the
   * remaining distance per frame. That fraction ramps from 0 to 0.14 over one
   * second, starting after a per-joint delay: feet and knees at
   * once, neck and hip after 0.4 s, arms after 0.5 s, head after 0.9 s. Joint
   * velocities are damped to 60% so the motion stays controlled.
   *
   * Finishes (and restarts the idle loop from t = 0) when every joint is within
   * 1.5% of H of its target after at least 1.5 s, or unconditionally after 5 s.
   */
  R.rise=function(){
    var W=this.W,H=this.H,ok=true;this.riseT+=.016;
    for(var i=0;i<this.points.length;i++){
      var p=this.points[i],tx=W*.5+IDLE[i][0]*H,ty=H*.5+IDLE[i][1]*H,dl=i>2?(i>6?0:.5):(i?.4:.9),k=Math.max(0,Math.min(.14,(this.riseT-dl)*.14));
      p.x+=(tx-p.x)*k;p.y+=(ty-p.y)*k;p.px=p.x-(p.x-p.px)*.6;p.py=p.y-(p.y-p.py)*.6;
      if(Math.hypot(tx-p.x,ty-p.y)>H*.015)ok=false;
    }
    if(ok&&this.riseT>1.5||this.riseT>5){this.idle=true;this.rising=false;this.still=0;this.t=0;this.pose()}
  };

  /**
   * Advance the simulation by one frame.
   *
   * While idle, only the idle clock and pose advance. Otherwise:
   * 1. Verlet integration: each joint keeps 99.5% of its velocity and falls
   *    under gravity (0.004·H per frame², fading to 0 while rising).
   * 2. Eight solver passes, each one enforcing every bone length, keeping all
   *    joints inside the pill (head margin 0.085·H, others 0.03·H) and pinning
   *    the grabbed joint to the pointer.
   * 3. State: dragging cancels any get-up; otherwise once the fastest joint
   *    has moved less than 0.004·H per frame for 90 frames (~1.5 s), the
   *    figure starts to rise.
   */
  R.step=function(){
    if(this.idle){this.t+=.016;this.pose();return}
    var P=this.points,H=this.H,gr=H*.004*(this.rising?Math.max(0,1-this.riseT/1.5):1),i,j;
    for(i=0;i<P.length;i++){var p=P[i],vx=(p.x-p.px)*.995,vy=(p.y-p.py)*.995;p.px=p.x;p.py=p.y;p.x+=vx;p.y+=vy+gr}
    for(j=0;j<8;j++){
      for(i=0;i<BONES.length;i++){
        // move both ends half the length error each (scaled by stiffness)
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
  /** Switch to physics, starting from rest, and cancel any get-up in progress. */
  R.wake=function(){
    if(this.idle){this.idle=false;this.points.forEach(function(p){p.px=p.x;p.py=p.y})}
    this.rising=false;this.still=0;
  };

  /**
   * Index of the joint closest to (x,y), within a grab radius of 0.4·H.
   * @param {number} x
   * @param {number} y
   * @returns {number} Joint index, or -1 when none is close enough.
   */
  R.nearest=function(x,y){var k=-1,m=this.H*.4;this.points.forEach(function(p,i){var d=Math.hypot(p.x-x,p.y-y);if(d<m){m=d;k=i}});return k};

  // grab the joint nearest to (x,y); false when nothing is close enough
  /**
   * Start dragging the joint nearest to (x,y). Wakes the figure.
   * @param {number} x Pointer x in CSS pixels, relative to the box.
   * @param {number} y Pointer y in CSS pixels, relative to the box.
   * @returns {boolean} False when nothing is close enough to grab.
   */
  R.grab=function(x,y){
    var k=this.nearest(x,y);if(k<0)return false;
    this.wake();this.drag=k;this.gx=x;this.gy=y;return true;
  };
  /** Move the drag target; the joint follows on the next {@link Ragdoll#step}. */
  R.dragTo=function(x,y){this.gx=x;this.gy=y};
  /** Let go of the grabbed joint; it keeps its current velocity. */
  R.release=function(){this.drag=-1};
  /** @returns {boolean} Whether a joint is currently grabbed. */
  R.isDragging=function(){return this.drag>=0};

  // pointer moving by (dx,dy) at (x,y) pushes nearby joints in that direction
  /**
   * Nudge the figure with a moving pointer, without grabbing it.
   *
   * The movement is clamped to ±0.5·H per axis and ignored below 0.02·H, so
   * slow hovering does nothing. Joints within 0.5·H of the pointer receive a
   * velocity impulse of 22% of the movement, fading linearly with distance.
   * @param {number} x Pointer x, relative to the box.
   * @param {number} y Pointer y, relative to the box.
   * @param {number} dx Pointer movement since the last event, x.
   * @param {number} dy Pointer movement since the last event, y.
   */
  R.push=function(x,y,dx,dy){
    var H=this.H,mx=Math.max(-H*.5,Math.min(H*.5,dx)),my=Math.max(-H*.5,Math.min(H*.5,dy)),r=H*.5;
    if(Math.hypot(mx,my)<=H*.02)return;
    var hit=this.points.filter(function(p){return Math.hypot(p.x-x,p.y-y)<r});
    if(!hit.length)return;
    this.wake();
    // in verlet, moving the previous position back adds velocity forwards
    hit.forEach(function(p){var w=1-Math.hypot(p.x-x,p.y-y)/r;p.px-=mx*w*.22;p.py-=my*w*.22});
  };

  CV.Ragdoll=Ragdoll;
})(window.CV=window.CV||{});
