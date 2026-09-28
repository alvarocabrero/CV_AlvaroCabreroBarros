// Model: media helpers and the gallery shown in the popups. No DOM access.
(function(CV){
  var Media={
    isVideo:function(src){return /\.(webm|mp4)$/i.test(src)},
    // privacy-friendly YouTube embed URL for a watch/playlist link, or null
    youtubeEmbed:function(u){
      try{
        var x=new URL(u),list=x.searchParams.get('list'),v=x.searchParams.get('v'),base='https://www.youtube-nocookie.com/embed/';
        if(v)return base+encodeURIComponent(v)+'?autoplay=1&rel=0'+(list?'&list='+encodeURIComponent(list):'');
        if(list)return base+'videoseries?list='+encodeURIComponent(list)+'&autoplay=1&rel=0';
      }catch(e){}
      return null;
    },
    steamWidget:function(app){return 'https://store.steampowered.com/widget/'+app+'/'}
  };

  // ordered list of images/videos with a current position (wraps around)
  function Gallery(title,srcs,index){this.title=title;this.srcs=srcs;this.index=index||0}
  Gallery.prototype.count=function(){return this.srcs.length};
  Gallery.prototype.current=function(){return this.srcs[this.index]};
  Gallery.prototype.alt=function(){return this.title+' '+(this.index+1)};
  Gallery.prototype.move=function(d){var n=this.count();this.index=(this.index+d+n)%n};
  Gallery.fromElement=function(el){return new Gallery(el.getAttribute('data-title'),el.getAttribute('data-imgs').split(','))};

  CV.Media=Media;
  CV.Gallery=Gallery;
})(window.CV=window.CV||{});
