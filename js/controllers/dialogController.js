/**
 * @file Controller: opens the popup from YouTube links, Steam links and carousels.
 *
 * Links are enhanced progressively: they are ordinary `<a href>` elements in
 * the markup, and are only intercepted when the popup can show them. Without
 * modal dialog support, or for a YouTube URL that cannot be embedded, the
 * click goes through and the link opens normally.
 *
 * Markup hooks:
 * - Any `<a href="…youtube.com…">` opens the video in the popup.
 * - `<a class="steam" data-steam="APP_ID" data-title="Game">` opens the Steam
 *   store widget for that app.
 */
(function(CV){
  /**
   * @constructor
   * @param {CV.DialogView} view The shared popup.
   */
  function DialogController(view){
    /** Whether the popup can be used (see {@link DialogView}). */
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
    /**
     * Open a gallery in the popup at its current index. The arrows and ←/→
     * move through it, wrapping around.
     * @param {CV.Gallery} gallery A gallery of its own; it is mutated while browsing.
     */
    this.openGallery=function(gallery){
      function show(){var s=gallery.current();view.renderMedia(s,CV.Media.isVideo(s),gallery.alt())}
      view.onNav=function(d){gallery.move(d);show()};
      show();view.openMedia();
    };
  }
  CV.DialogController=DialogController;
})(window.CV=window.CV||{});
