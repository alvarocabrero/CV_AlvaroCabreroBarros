/**
 * @file Controller: carousel behaviour (dots, keyboard, hover autoplay, video playback) and opening the popup.
 *
 * Behaviour:
 * - Swipe or scroll the strip (native scroll-snap), click a dot, or focus the
 *   strip and use ←/→ to change slide. Navigation wraps around.
 * - Without hover, the visible slide's video loops muted while the carousel is
 *   on screen; every other video is paused.
 * - On hover (mouse only), the carousel plays through: each video plays once
 *   from the start, each image stays for 1.5 s, then it advances.
 * - Click the frame to open the current slide enlarged in the popup.
 * - With reduced motion, slides scroll instantly and videos only play on hover.
 */
(function(CV){
  /**
   * @constructor
   * @param {Element} el A `.car` placeholder with `data-title` and `data-imgs`.
   * @param {CV.DialogController} dialog Shared popup, used to enlarge slides.
   */
  function CarouselController(el,dialog){
    // hover: pointer is over the carousel; vis: carousel is on screen;
    // timer: pending advance/step while hovering
    var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,
        gallery=CV.Gallery.fromElement(el),view=new CV.CarouselView(el,gallery),n=gallery.count(),
        hover=false,vis=true,timer=null;

    /** Go to slide i, wrapping around both ends. */
    function go(i){view.scrollTo((i+n)%n,!reduce)}
    // only the visible slide's video plays, and only while it makes sense to
    /**
     * Pause every video except the visible one. While hovering, playback is
     * left to step(), so only pausing happens here.
     */
    function sync(){
      var k=view.index();
      view.slides.forEach(function(_,i){
        var v=view.video(i);if(!v)return;
        if(i!==k||!vis||(reduce&&!hover))v.pause();else if(!hover&&v.paused)v.play().catch(function(){});
      });
    }
    /** After any scroll: update the dots and the video playback. */
    function mark(){view.markDot(view.index());sync()}
    // while hovering, play each slide's video once, then advance
    /**
     * Hover autoplay, part 1: show the current slide. A video plays once from
     * the start and advances when it ends; an image (or a video that has not
     * loaded yet) advances after 1.5 s.
     */
    function step(){
      clearTimeout(timer);if(!hover)return;
      var v=view.video(view.index());
      if(v&&v.readyState>=1){v.loop=false;v.currentTime=0;v.onended=next;v.play().catch(function(){})}
      else timer=setTimeout(next,1500);
    }
    /** Hover autoplay, part 2: advance, then wait 600 ms for the scroll to settle. */
    function next(){if(!hover)return;go(view.index()+1);clearTimeout(timer);timer=setTimeout(step,600)}

    el.addEventListener('mouseenter',function(){if(hover)return;hover=true;next()});
    // leaving restores looping videos and normal playback
    el.addEventListener('mouseleave',function(){
      hover=false;clearTimeout(timer);
      view.slides.forEach(function(_,i){var v=view.video(i);if(v){v.loop=true;v.onended=null}});
      sync();
    });
    view.dots.forEach(function(b,i){b.addEventListener('click',function(){go(i)})});
    view.track.addEventListener('scroll',mark);
    view.track.addEventListener('keydown',function(e){
      if(e.key==='ArrowRight'){e.preventDefault();go(view.index()+1)}
      else if(e.key==='ArrowLeft'){e.preventDefault();go(view.index()-1)}
    });
    // pause videos while the carousel is off screen
    if('IntersectionObserver' in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting;sync()},{threshold:.25}).observe(el);
    mark();

    // clicking the carousel enlarges the current slide in the popup
    if(dialog.supported)view.frame.addEventListener('click',function(){
      dialog.openGallery(new CV.Gallery(gallery.title,gallery.srcs,view.index()));
    });
  }
  CV.CarouselController=CarouselController;
})(window.CV=window.CV||{});
