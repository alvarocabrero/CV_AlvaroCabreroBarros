// View: the shared popup dialog (YouTube, Steam widget, enlarged carousel media).
(function(CV){
  function DialogView(){
    var self=this;
    this.dlg=document.getElementById('vid');
    this.frame=document.getElementById('vidframe');
    this.link=document.getElementById('vidlink');
    this.supported=!!this.dlg.showModal;
    this.onNav=null; // set by the controller while a gallery is open: fn(direction)

    document.getElementById('vidclose').addEventListener('click',function(){self.dlg.close()});
    this.dlg.addEventListener('click',function(e){if(e.target===self.dlg)self.dlg.close()});
    this.dlg.addEventListener('close',function(){self.frame.innerHTML='';self.dlg.classList.remove('steam');self.onNav=null});
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

  V.setLink=function(href,text){this.link.href=href;this.link.textContent=text;this.link.style.visibility=''};

  V.showYouTube=function(src,href){
    this.frame.innerHTML='<iframe src="'+src+'" title="YouTube video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>';
    this.setLink(href,'Open on YouTube');this.dlg.showModal();
  };

  V.showSteam=function(src,href,title){
    this.frame.innerHTML='<iframe src="'+src+'" title="'+title+' on Steam" loading="lazy"></iframe>';
    this.setLink(href,'Open on Steam');this.dlg.classList.add('steam');this.dlg.showModal();
  };

  // image or video with previous/next arrows
  V.renderMedia=function(src,isVideo,alt){
    this.frame.innerHTML=(isVideo?'<video src="'+src+'" controls autoplay loop playsinline></video>':'<img src="'+src+'" alt="'+alt+'">')
      +'<button type="button" class="nav prev" aria-label="Previous">&#8249;</button><button type="button" class="nav next" aria-label="Next">&#8250;</button>';
  };
  V.openMedia=function(){this.link.style.visibility='hidden';this.dlg.classList.remove('steam');this.dlg.showModal()};

  CV.DialogView=DialogView;
})(window.CV=window.CV||{});
