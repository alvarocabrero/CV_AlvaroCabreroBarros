/**
 * @file View: builds one carousel (slides, caption, dots) inside its container and exposes DOM helpers.
 *
 * Generated markup, inside the `.car` placeholder:
 *
 *   <div class="frame">
 *     <div class="track" tabindex="0">        ← horizontal scroll-snap strip
 *       <figure class="slide"><img|video></figure> …
 *     </div>
 *     <div class="cap">Title</div>             ← caption over the bottom edge
 *   </div>
 *   <div class="dots"><button>…</button> …</div>
 *
 * Slides are plain scroll positions: slide i starts at i × track width.
 * Each slide stays hidden behind the accent-coloured placeholder until its
 * media has loaded (the `.has` class), so broken or slow files never show a
 * half-drawn frame.
 *
 * Titles and paths come from the page's own markup and are inserted as HTML,
 * so they must be trusted content (no user input).
 */
(function(CV){
  /**
   * @constructor
   * @param {Element} el The `.car` container; its contents are replaced.
   * @param {CV.Gallery} gallery Title and media paths to show.
   */
  function CarouselView(el,gallery){
    var title=gallery.title,h='<div class="frame"><div class="track" tabindex="0" aria-label="'+title+' slides">',d='';
    gallery.srcs.forEach(function(src,i){
      // videos: muted + playsinline so mobile browsers allow autoplay;
      // preload="metadata" avoids downloading every clip up front
      h+='<figure class="slide">'+(CV.Media.isVideo(src)
        ?'<video src="'+src+'" muted loop playsinline preload="metadata" aria-label="'+title+' video '+(i+1)+'"></video>'
        :'<img src="'+src+'" alt="'+title+' image '+(i+1)+'">')+'</figure>';
      d+='<button type="button" aria-label="Go to slide '+(i+1)+'"></button>';
    });
    el.innerHTML=h+'</div><div class="cap">'+title+'</div></div><div class="dots">'+d+'</div>';
    /** @type {Element} */ this.el=el;
    /** Rounded clipping box; clicking it opens the enlarged view. */ this.frame=el.querySelector('.frame');
    /** Scrollable strip holding the slides. */ this.track=el.querySelector('.track');
    /** @type {HTMLButtonElement[]} One button per slide. */ this.dots=[].slice.call(el.querySelectorAll('.dots button'));
    /** @type {HTMLElement[]} */ this.slides=[].slice.call(el.querySelectorAll('.slide'));
    // reveal each slide once its media can be shown (also if it loaded before
    // the listener was attached, e.g. from cache)
    this.slides.forEach(function(sl){
      var m=sl.querySelector('img,video'),ok=function(){sl.classList.add('has')};
      m.addEventListener(m.tagName==='VIDEO'?'loadeddata':'load',ok);
      if((m.complete&&m.naturalWidth)||m.readyState>=2)ok();
    });
  }
  var V=CarouselView.prototype;

  /** @returns {number} Index of the slide currently snapped into view. */
  V.index=function(){return Math.round(this.track.scrollLeft/this.track.clientWidth)};
  /**
   * Scroll to slide i (no wrapping; the controller wraps).
   * @param {number} i Slide index.
   * @param {boolean} smooth Animate the scroll.
   */
  V.scrollTo=function(i,smooth){this.track.scrollTo({left:i*this.track.clientWidth,behavior:smooth?'smooth':'auto'})};
  /**
   * @param {number} i Slide index.
   * @returns {?HTMLVideoElement} The slide's video, or null for an image.
   */
  V.video=function(i){return this.slides[i].querySelector('video')};
  /**
   * Highlight the dot of slide k (via `aria-current`, which also styles it).
   * @param {number} k Slide index.
   */
  V.markDot=function(k){this.dots.forEach(function(b,i){b.setAttribute('aria-current',i===k?'true':'false')})};

  CV.CarouselView=CarouselView;
})(window.CV=window.CV||{});
