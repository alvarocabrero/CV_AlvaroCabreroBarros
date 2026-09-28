// Controller: opens the popup from YouTube links, Steam links and carousels.
(function(CV){
  function DialogController(view){
    this.supported=view.supported;

    [].forEach.call(document.querySelectorAll('a[href*="youtube.com"]'),function(a){
      a.addEventListener('click',function(e){
        var src=CV.Media.youtubeEmbed(a.href);
        if(!src||!view.supported)return;
        e.preventDefault();view.showYouTube(src,a.href);
      });
    });

    [].forEach.call(document.querySelectorAll('a.steam'),function(a){
      a.addEventListener('click',function(e){
        if(!view.supported)return;
        e.preventDefault();
        view.showSteam(CV.Media.steamWidget(a.getAttribute('data-steam')),a.href,a.getAttribute('data-title'));
      });
    });

    // enlarged media with arrows / arrow keys to move through the gallery
    this.openGallery=function(gallery){
      function show(){var s=gallery.current();view.renderMedia(s,CV.Media.isVideo(s),gallery.alt())}
      view.onNav=function(d){gallery.move(d);show()};
      show();view.openMedia();
    };
  }
  CV.DialogController=DialogController;
})(window.CV=window.CV||{});
