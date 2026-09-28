// Controller: carousel behaviour (dots, keyboard, hover autoplay, video playback) and opening the popup.
(function(CV){
  function CarouselController(el,dialog){
    var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,
        gallery=CV.Gallery.fromElement(el),view=new CV.CarouselView(el,gallery),n=gallery.count(),
        hover=false,vis=true,timer=null;

    function go(i){view.scrollTo((i+n)%n,!reduce)}
    // only the visible slide's video plays, and only while it makes sense to
    function sync(){
      var k=view.index();
      view.slides.forEach(function(_,i){
        var v=view.video(i);if(!v)return;
        if(i!==k||!vis||(reduce&&!hover))v.pause();else if(!hover&&v.paused)v.play().catch(function(){});
      });
    }
    function mark(){view.markDot(view.index());sync()}
    // while hovering, play each slide's video once, then advance
    function step(){
      clearTimeout(timer);if(!hover)return;
      var v=view.video(view.index());
      if(v&&v.readyState>=1){v.loop=false;v.currentTime=0;v.onended=next;v.play().catch(function(){})}
      else timer=setTimeout(next,1500);
    }
    function next(){if(!hover)return;go(view.index()+1);clearTimeout(timer);timer=setTimeout(step,600)}

    el.addEventListener('mouseenter',function(){if(hover)return;hover=true;next()});
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
    if('IntersectionObserver' in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting;sync()},{threshold:.25}).observe(el);
    mark();

    // clicking the carousel enlarges the current slide in the popup
    if(dialog.supported)view.frame.addEventListener('click',function(){
      dialog.openGallery(new CV.Gallery(gallery.title,gallery.srcs,view.index()));
    });
  }
  CV.CarouselController=CarouselController;
})(window.CV=window.CV||{});
