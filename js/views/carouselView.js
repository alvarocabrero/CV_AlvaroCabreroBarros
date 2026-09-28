// View: builds one carousel (slides, caption, dots) inside its container and exposes DOM helpers.
(function(CV){
  function CarouselView(el,gallery){
    var title=gallery.title,h='<div class="frame"><div class="track" tabindex="0" aria-label="'+title+' slides">',d='';
    gallery.srcs.forEach(function(src,i){
      h+='<figure class="slide">'+(CV.Media.isVideo(src)
        ?'<video src="'+src+'" muted loop playsinline preload="metadata" aria-label="'+title+' video '+(i+1)+'"></video>'
        :'<img src="'+src+'" alt="'+title+' image '+(i+1)+'">')+'</figure>';
      d+='<button type="button" aria-label="Go to slide '+(i+1)+'"></button>';
    });
    el.innerHTML=h+'</div><div class="cap">'+title+'</div></div><div class="dots">'+d+'</div>';
    this.el=el;
    this.frame=el.querySelector('.frame');
    this.track=el.querySelector('.track');
    this.dots=[].slice.call(el.querySelectorAll('.dots button'));
    this.slides=[].slice.call(el.querySelectorAll('.slide'));
    this.slides.forEach(function(sl){
      var m=sl.querySelector('img,video'),ok=function(){sl.classList.add('has')};
      m.addEventListener(m.tagName==='VIDEO'?'loadeddata':'load',ok);
      if((m.complete&&m.naturalWidth)||m.readyState>=2)ok();
    });
  }
  var V=CarouselView.prototype;

  V.index=function(){return Math.round(this.track.scrollLeft/this.track.clientWidth)};
  V.scrollTo=function(i,smooth){this.track.scrollTo({left:i*this.track.clientWidth,behavior:smooth?'smooth':'auto'})};
  V.video=function(i){return this.slides[i].querySelector('video')};
  V.markDot=function(k){this.dots.forEach(function(b,i){b.setAttribute('aria-current',i===k?'true':'false')})};

  CV.CarouselView=CarouselView;
})(window.CV=window.CV||{});
