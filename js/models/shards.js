// Model: the fragments of the pill breaking apart. No DOM access.
(function(CV){
  // rect {x,y,w,h} is the pill in window coordinates, (ox,oy) the point where it was hit
  function Shards(rect,ox,oy){
    var cols=8,rows=3,cw=rect.w/cols,ch=rect.h/rows,r=rect.h/2;
    this.list=[];
    for(var j=0;j<rows;j++)for(var i=0;i<cols;i++){
      var x0=rect.x+i*cw,y0=rect.y+j*ch,mx=i*cw+cw/2,my=j*ch+ch/2,cx=Math.max(r,Math.min(rect.w-r,mx));
      if(Math.hypot(mx-cx,my-r)>r)continue; // outside the rounded ends
      var a=[x0,y0],b=[x0+cw,y0],c=[x0+cw,y0+ch],d=[x0,y0+ch],
          tris=Math.random()<.5?[[a,b,c],[a,c,d]]:[[a,b,d],[b,c,d]];
      for(var k=0;k<2;k++)this.list.push(this.make(tris[k],ox,oy));
    }
  }
  var S=Shards.prototype;

  S.make=function(t,ox,oy){
    var cx=(t[0][0]+t[1][0]+t[2][0])/3,cy=(t[0][1]+t[1][1]+t[2][1])/3,
        dx=cx-ox,dy=cy-oy,d=Math.hypot(dx,dy)||1,sp=1.5+Math.random()*3.5;
    return{
      x:cx,y:cy,a:0,
      pts:t.map(function(p){return[p[0]-cx,p[1]-cy]}),
      vx:dx/d*sp+(Math.random()-.5)*1.5,vy:dy/d*sp-2-Math.random()*2,
      va:(Math.random()-.5)*.25,life:1
    };
  };

  S.step=function(){
    this.list.forEach(function(s){s.vy+=.45;s.x+=s.vx;s.y+=s.vy;s.a+=s.va;s.life-=.012});
    this.list=this.list.filter(function(s){return s.life>0});
  };
  S.alive=function(){return this.list.length>0};

  CV.Shards=Shards;
})(window.CV=window.CV||{});
