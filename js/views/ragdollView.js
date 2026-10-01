/**
 * @file View: draws the ragdoll on its canvas.
 *
 * The canvas sits inside the `.pill` span in the hero heading and is sized by
 * CSS. This view keeps its backing store sharp on high-DPI screens and
 * converts pointer events to canvas-local coordinates. All drawing uses CSS
 * pixels; the device pixel ratio is folded into the context transform.
 */
(function(CV){
  /**
   * @constructor
   * @param {HTMLCanvasElement} canvas The `#ik` canvas.
   */
  function RagdollView(canvas){this.canvas=canvas;this.g=canvas.getContext('2d')}
  var V=RagdollView.prototype;

  // match the canvas resolution to its CSS size; returns the size in CSS pixels
  /**
   * Resize the backing store to CSS size × devicePixelRatio and reset the
   * transform so drawing code can keep working in CSS pixels.
   * @returns {{w:number,h:number}} Canvas size in CSS pixels.
   */
  V.resize=function(){
    var r=this.canvas.getBoundingClientRect(),d=window.devicePixelRatio||1;
    this.canvas.width=r.width*d;this.canvas.height=r.height*d;this.g.setTransform(d,0,0,d,0,0);
    return{w:r.width,h:r.height};
  };

  /**
   * Draw the figure as white strokes: spine, both arms as one polyline through
   * the neck, both legs as one polyline through the hip, and a filled head.
   * Line width (0.055·H) and head radius (0.085·H) scale with the canvas.
   * @param {CV.Ragdoll} model
   */
  V.draw=function(model){
    var g=this.g,P=model.points,H=model.H;
    g.clearRect(0,0,model.W,H);g.strokeStyle=g.fillStyle='#fff';g.lineCap='round';g.lineJoin='round';g.lineWidth=H*.055;
    // stroke a polyline through the given joint indices
    function line(){g.beginPath();g.moveTo(P[arguments[0]].x,P[arguments[0]].y);for(var i=1;i<arguments.length;i++)g.lineTo(P[arguments[i]].x,P[arguments[i]].y);g.stroke()}
    line(1,2);line(4,3,1,5,6);line(8,7,2,9,10);
    g.beginPath();g.arc(P[0].x,P[0].y,H*.085,0,7);g.fill(); // 7 rad > 2π: a full circle
  };

  // pointer position relative to the canvas
  /**
   * @param {PointerEvent} e
   * @returns {number[]} `[x, y]` in CSS pixels from the canvas's top-left corner.
   */
  V.local=function(e){var r=this.canvas.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
  /** @param {string} v CSS cursor value, or '' to restore the stylesheet's `grab`. */
  V.cursor=function(v){this.canvas.style.cursor=v};
  /**
   * Keep receiving a pointer's events while dragging, even outside the canvas.
   * Errors (e.g. the pointer is already gone) are ignored.
   * @param {number} id Pointer id from the PointerEvent.
   */
  V.capture=function(id){try{this.canvas.setPointerCapture(id)}catch(_){}};

  CV.RagdollView=RagdollView;
})(window.CV=window.CV||{});
