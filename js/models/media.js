/**
 * @file Model: media helpers and the gallery shown in the popups. No DOM access.
 *
 * Exposes:
 * - `CV.Media`: stateless helpers that classify media files and build embed URLs.
 * - `CV.Gallery`: an ordered, wrap-around list of images/videos with a cursor.
 */
(function(CV){
  /**
   * Stateless media helpers.
   * @namespace CV.Media
   */
  var Media={
    /**
     * Whether a source path points to a video the page can play inline.
     * Only the extension is checked, so query strings are not supported.
     * @param {string} src Image or video path, e.g. `images/turok-origins-1.mp4`.
     * @returns {boolean} True for `.webm` and `.mp4` files.
     */
    isVideo:function(src){return /\.(webm|mp4)$/i.test(src)},
    /**
     * Privacy-friendly YouTube embed URL for a watch/playlist link, or null.
     * Uses the youtube-nocookie.com domain, autoplays, and hides related videos
     * from other channels (`rel=0`).
     *
     * Supported inputs:
     * - `https://www.youtube.com/watch?v=ID` → `/embed/ID`
     * - `https://www.youtube.com/watch?v=ID&list=PL` → `/embed/ID?list=PL`
     * - `https://youtube.com/playlist?list=PL` → `/embed/videoseries?list=PL`
     *
     * Anything else (including `youtu.be` short links) returns null, and the
     * caller then lets the link open normally.
     * @param {string} u Absolute YouTube URL.
     * @returns {?string} Embed URL, or null when it cannot be embedded.
     */
    youtubeEmbed:function(u){
      try{
        var x=new URL(u),list=x.searchParams.get('list'),v=x.searchParams.get('v'),base='https://www.youtube-nocookie.com/embed/';
        if(v)return base+encodeURIComponent(v)+'?autoplay=1&rel=0'+(list?'&list='+encodeURIComponent(list):'');
        if(list)return base+'videoseries?list='+encodeURIComponent(list)+'&autoplay=1&rel=0';
      }catch(e){}
      return null;
    },
    /**
     * URL of Steam's embeddable store widget for an app.
     * @param {string|number} app Steam app id, e.g. `1967610`.
     * @returns {string} Widget URL to load in an iframe.
     */
    steamWidget:function(app){return 'https://store.steampowered.com/widget/'+app+'/'}
  };

  /**
   * Ordered list of images/videos with a current position (wraps around).
   * @constructor
   * @param {string} title Human-readable title, used for captions and alt text.
   * @param {string[]} srcs Media paths, in display order.
   * @param {number} [index=0] Initially selected position.
   */
  function Gallery(title,srcs,index){this.title=title;this.srcs=srcs;this.index=index||0}
  /** @returns {number} Number of items. */
  Gallery.prototype.count=function(){return this.srcs.length};
  /** @returns {string} Path of the selected item. */
  Gallery.prototype.current=function(){return this.srcs[this.index]};
  /** @returns {string} Alt text for the selected item, e.g. "John Wick 2". */
  Gallery.prototype.alt=function(){return this.title+' '+(this.index+1)};
  /**
   * Move the cursor, wrapping past either end.
   * @param {number} d Step, usually +1 (next) or -1 (previous).
   */
  Gallery.prototype.move=function(d){var n=this.count();this.index=(this.index+d+n)%n};
  /**
   * Build a gallery from a carousel placeholder in the markup.
   * Reads `data-title` and the comma-separated `data-imgs` attribute.
   * @param {Element} el A `.car` element.
   * @returns {Gallery}
   */
  Gallery.fromElement=function(el){return new Gallery(el.getAttribute('data-title'),el.getAttribute('data-imgs').split(','))};

  CV.Media=Media;
  CV.Gallery=Gallery;
})(window.CV=window.CV||{});
