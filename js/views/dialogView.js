/**
 * @file View: the shared popup dialog (YouTube, Steam widget, enlarged carousel media).
 *
 * There is a single `<dialog id="vid">` in the page. It has three modes:
 * - YouTube: an autoplaying embed, with an "Open on YouTube" link.
 * - Steam:   the store widget in a shorter frame (the `steam` class), with an
 *            "Open on Steam" link.
 * - Media:   an enlarged carousel image or video with previous/next arrows;
 *            the external link is hidden.
 *
 * It closes with the Close button, a click on the backdrop or Esc (native
 * dialog behaviour). Closing empties the frame, which also stops any playback.
 *
 * Browsers without `HTMLDialogElement.showModal` are reported through
 * `supported`; controllers then leave links and carousels to behave normally.
 */
(function(CV){
  /** @constructor */
  function DialogView(){
    var self=this;
    /** @type {HTMLDialogElement} */ this.dlg=document.getElementById('vid');
    /** Container for the iframe, image or video. */ this.frame=document.getElementById('vidframe');
    /** External link in the top bar ("Open on YouTube/Steam"). */ this.link=document.getElementById('vidlink');
    /** Whether modal dialogs are available in this browser. */ this.supported=!!this.dlg.showModal;
    this.onNav=null; // set by the controller while a gallery is open: fn(direction)

    document.getElementById('vidclose').addEventListener('click',function(){self.dlg.close()});
    // a click on the dialog element itself (not its children) is a click on the backdrop
    this.dlg.addEventListener('click',function(e){if(e.target===self.dlg)self.dlg.close()});
    this.dlg.addEventListener('close',function(){self.frame.innerHTML='';self.dlg.classList.remove('steam');self.onNav=null});
    // arrow buttons are re-rendered with each item, so listen on the frame
    this.frame.addEventListener('click',function(e){
      var b=e.target.closest('.nav');
      if(b&&self.onNav)self.onNav(b.classList.contains('next')?1:-1);
    });
    this.dlg.addEventListener('keydown',function(e){
      if(!self.onNav)return;
      if(e.key==='ArrowRight'){e.preventDefault();self.onNav(1)}
      else if(e.key==='ArrowLeft'){e.preventDefault();self.onNav(-1)}
    });
  }
  var V=DialogView.prototype;

  /**
   * Show the external link in the top bar.
   * @param {string} href
   * @param {string} text
   */
  V.setLink=function(href,text){this.link.href=href;this.link.textContent=text;this.link.style.visibility=''};

  /**
   * Open a YouTube embed.
   * @param {string} src Embed URL from {@link CV.Media.youtubeEmbed}.
   * @param {string} href Original YouTube link, for "Open on YouTube".
   */
  V.showYouTube=function(src,href){
    this.frame.innerHTML='<iframe src="'+src+'" title="YouTube video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>';
    this.setLink(href,'Open on YouTube');this.dlg.showModal();
  };

  /**
   * Open a Steam store widget.
   * @param {string} src Widget URL from {@link CV.Media.steamWidget}.
   * @param {string} href Store page, for "Open on Steam".
   * @param {string} title Game title, used for the iframe's accessible name.
   */
  V.showSteam=function(src,href,title){
    this.frame.innerHTML='<iframe src="'+src+'" title="'+title+' on Steam" loading="lazy"></iframe>';
    this.setLink(href,'Open on Steam');this.dlg.classList.add('steam');this.dlg.showModal();
  };

  // image or video with previous/next arrows
  /**
   * Replace the frame's content with one gallery item. Does not open the
   * dialog, so it is also used to switch items while open.
   * @param {string} src Media path.
   * @param {boolean} isVideo Render a `<video>` (with controls) instead of an `<img>`.
   * @param {string} alt Alt text for images.
   */
  V.renderMedia=function(src,isVideo,alt){
    this.frame.innerHTML=(isVideo?'<video src="'+src+'" controls autoplay loop playsinline></video>':'<img src="'+src+'" alt="'+alt+'">')
      +'<button type="button" class="nav prev" aria-label="Previous">&#8249;</button><button type="button" class="nav next" aria-label="Next">&#8250;</button>';
  };
  /** Open the dialog in media mode, after {@link DialogView#renderMedia}. */
  V.openMedia=function(){this.link.style.visibility='hidden';this.dlg.classList.remove('steam');this.dlg.showModal()};

  CV.DialogView=DialogView;
})(window.CV=window.CV||{});
