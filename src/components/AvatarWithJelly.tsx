import { useRef, useEffect, useCallback, useState } from "react";
import { animate } from "animejs";

const SZ = 126, MX = 12;

const VO_DATA = [{"cp":"polygon(16.6px 23.4px, 23.8px 16.3px, 32.5px 10.2px, 42.1px 5.7px, 52.0px 3.0px, 52.0px 31.1px, 41.0px 37.5px)","bgX":"-40.9","bgY":"-26.9","si":2,"sh":11},{"cp":"polygon(52.0px 31.1px, 52.0px 3.0px, 52.4px 2.9px, 63.0px 2.0px, 73.6px 2.9px, 74.0px 3.0px, 74.0px 31.1px, 63.0px 37.5px)","bgX":"-63.7","bgY":"-24.4","si":3,"sh":11},{"cp":"polygon(74.0px 31.1px, 74.0px 3.0px, 83.9px 5.7px, 93.5px 10.2px, 102.2px 16.3px, 109.4px 23.4px, 85.0px 37.5px)","bgX":"-83.5","bgY":"-24.3","si":2,"sh":11},{"cp":"polygon(5.6px 42.5px, 5.7px 42.1px, 10.2px 32.5px, 16.3px 23.8px, 16.6px 23.4px, 41.0px 37.5px, 41.0px 50.3px, 30.0px 56.6px)","bgX":"-28.1","bgY":"-48.7","si":1,"sh":11},{"cp":"polygon(41.0px 50.3px, 41.0px 37.5px, 52.0px 31.1px, 63.0px 37.5px, 63.0px 50.3px, 52.0px 56.6px)","bgX":"-47.3","bgY":"-40.1","si":2,"sh":11},{"cp":"polygon(63.0px 50.3px, 63.0px 37.5px, 74.0px 31.1px, 85.0px 37.5px, 85.0px 50.3px, 74.0px 56.6px)","bgX":"-77.1","bgY":"-43.2","si":3,"sh":11},{"cp":"polygon(96.0px 56.6px, 85.0px 50.3px, 85.0px 37.5px, 109.4px 23.4px, 109.7px 23.8px, 115.8px 32.5px, 120.3px 42.1px, 120.4px 42.5px)","bgX":"-96.5","bgY":"-44.5","si":2,"sh":11},{"cp":"polygon(5.6px 83.5px, 2.9px 73.6px, 2.0px 63.0px, 2.9px 52.4px, 5.6px 42.5px, 30.0px 56.6px, 30.0px 69.4px)","bgX":"-21.8","bgY":"-67.5","si":1,"sh":11},{"cp":"polygon(30.0px 69.4px, 30.0px 56.6px, 41.0px 50.3px, 52.0px 56.6px, 52.0px 69.4px, 41.0px 75.7px)","bgX":"-45.7","bgY":"-67.3","si":1,"sh":11},{"cp":"polygon(52.0px 69.4px, 52.0px 56.6px, 63.0px 50.3px, 74.0px 56.6px, 74.0px 69.4px, 63.0px 75.7px)","bgX":"-58.8","bgY":"-61.6","si":4,"sh":5},{"cp":"polygon(74.0px 69.4px, 74.0px 56.6px, 85.0px 50.3px, 96.0px 56.6px, 96.0px 69.4px, 85.0px 75.7px)","bgX":"-88.3","bgY":"-66.0","si":4,"sh":5},{"cp":"polygon(124.0px 63.0px, 123.1px 73.6px, 120.4px 83.5px, 96.0px 69.4px, 96.0px 56.6px, 120.4px 42.5px, 123.1px 52.4px)","bgX":"-107.3","bgY":"-63.8","si":4,"sh":5},{"cp":"polygon(16.6px 102.6px, 16.3px 102.2px, 10.2px 93.5px, 5.7px 83.9px, 5.6px 83.5px, 30.0px 69.4px, 41.0px 75.7px, 41.0px 88.5px)","bgX":"-26.6","bgY":"-77.3","si":3,"sh":11},{"cp":"polygon(41.0px 88.5px, 41.0px 75.7px, 52.0px 69.4px, 63.0px 75.7px, 63.0px 88.5px, 52.0px 94.9px)","bgX":"-53.8","bgY":"-80.5","si":1,"sh":11},{"cp":"polygon(63.0px 88.5px, 63.0px 75.7px, 74.0px 69.4px, 85.0px 75.7px, 85.0px 88.5px, 74.0px 94.9px)","bgX":"-71.0","bgY":"-85.4","si":3,"sh":11},{"cp":"polygon(120.4px 83.5px, 120.3px 83.9px, 115.8px 93.5px, 109.7px 102.2px, 109.4px 102.6px, 85.0px 88.5px, 85.0px 75.7px, 96.0px 69.4px)","bgX":"-92.2","bgY":"-83.5","si":3,"sh":11},{"cp":"polygon(52.0px 123.0px, 42.1px 120.3px, 32.5px 115.8px, 23.8px 109.7px, 16.6px 102.6px, 41.0px 88.5px, 52.0px 94.9px)","bgX":"-40.0","bgY":"-96.9","si":1,"sh":11},{"cp":"polygon(74.0px 123.0px, 73.6px 123.1px, 63.0px 124.0px, 52.4px 123.1px, 52.0px 123.0px, 52.0px 94.9px, 63.0px 88.5px, 74.0px 94.9px)","bgX":"-60.4","bgY":"-102.7","si":2,"sh":11},{"cp":"polygon(109.4px 102.6px, 102.2px 109.7px, 93.5px 115.8px, 83.9px 120.3px, 74.0px 123.0px, 74.0px 94.9px, 85.0px 88.5px)","bgX":"-80.8","bgY":"-102.7","si":4,"sh":6}] as const;

const RI = [
  {rx:90,ry:36,sp:.35,c:"oklch(0.72 0.2 85 / 0.7)",n:12,sz:2.5,ri:"oklch(0.72 0.2 85 / 0.12)"},
  {rx:80,ry:30,sp:-.3,c:"oklch(0.63 0.15 20 / 0.55)",n:8,sz:2,ri:"oklch(0.63 0.15 20 / 0.08)"},
  {rx:96,ry:28,sp:.5,c:"rgba(255,255,255,0.4)",n:6,sz:2,ri:"rgba(255,255,255,0.06)"},
  {rx:84,ry:40,sp:-.45,c:"oklch(0.68 0.18 50 / 0.5)",n:8,sz:2.5,ri:"oklch(0.68 0.18 50 / 0.1)"},
];

function se(c,n,m){m=m||1;for(let i=0;i<n;i++){const e=document.createElement("div");const s=(2+Math.random()*3)*m,a=Math.random()*Math.PI*2,d=(5+Math.random()*20)*m;e.style.cssText=`position:absolute;left:63px;top:63px;border-radius:50%;width:${s}px;height:${s}px;pointer-events:none;background:oklch(${.6+Math.random()*.2} .25 ${20+Math.random()*30});box-shadow:0 0 ${s*3}px ${s}px oklch(.7 .25 35/.5);`;c.appendChild(e);animate(e,{translateX:Math.cos(a)*d,translateY:Math.sin(a)*d-10,opacity:[1,0],scale:[1,0.2],duration:400+Math.random()*400,ease:"out(2)",onComplete:()=>e.remove()});}}

export default function AvatarWithJelly(){
  const[dmg,setD]=useState(0);const[ph,setPh]=useState("idle");
  const br=useRef(null),fr=useRef(null),ar=useRef(null),frr=useRef([]);
  const anims = useRef({});

  const hc = useCallback(() => {
    if(ph!=="idle")return;
    const c=ar.current;if(!c)return;
    const n=dmg+1;setD(n);

    // 震动
    const it=3+n*2;
    animate(c,{translateX:[0,(Math.random()-.5)*it,(Math.random()-.5)*it*.6,0],translateY:[0,(Math.random()-.5)*it,(Math.random()-.5)*it*.6,0],duration:300+n*15,ease:"out(3)"});

    // 火星
    se(c,2+n);

    // 分裂阶段 (1-4)
    if(n<=4){
      VO_DATA.forEach((v,i)=>{
        if(v.si===n){
          const el=frr.current[i];if(!el)return;
          const a=Math.random()*Math.PI*2;
          animate(el,{translateX:Math.cos(a)*(2+n),translateY:Math.sin(a)*(2+n),duration:400,ease:"out(2)"});
        }
      });
    }

    // 抖动阶段 (5-11)
    if(n>=5&&n<=11){
      VO_DATA.forEach((v,i)=>{
        if(v.sh===n){
          const el=frr.current[i];if(!el)return;
          const curT=el.style.translate||"0px 0px";
          const [cx,cy]=curT.replace("px","").split(" ").map(Number);
          const amp=2+(n-5)*1.5;
          const spd=100+(n-5)*15;
          const an=animate(el,{
            translateX:[cx||0,cx+amp,cx-amp],
            translateY:[cy||0,cy-amp,cy+amp],
            duration:spd,ease:"inOut(1.5)",loop:true,
          });
          anims.current[i]=an;
        }
      });
      // 更多火星
      se(c,3+n);
    }

    // 爆炸 (12)
    if(n>=MX){
      setPh("bang");
      // 停止所有抖动
      Object.values(anims.current).forEach(a=>a.pause());
      // 全屏特效
      const ff=document.createElement("div");ff.style.cssText="position:fixed;inset:0;z-index:9999;background:white;pointer-events:none;";document.body.appendChild(ff);animate(ff,{opacity:[0,1,.7,0],duration:800,ease:"out(3)",onComplete:()=>ff.remove()});
      const hh=document.documentElement;hh.style.transition="transform .6s ease-out";hh.style.transform=`translate(${(Math.random()-.5)*12}px,${(Math.random()-.5)*12}px)`;setTimeout(()=>{hh.style.transform=`translate(${(Math.random()-.5)*8}px,${(Math.random()-.5)*8}px)`;setTimeout(()=>{hh.style.transform="";hh.style.transition="";},200);},100);
      const img=c.querySelector("img");if(img)img.style.display="none";
      // 碎片飞散
      VO_DATA.forEach((v,i)=>{
        const el=frr.current[i];if(!el)return;
        const a=Math.random()*Math.PI*2;
        animate(el,{translateX:Math.cos(a)*(40+Math.random()*180),translateY:Math.sin(a)*(40+Math.random()*180),rotate:(Math.random()-.5)*800,opacity:[1,0.3],duration:500+Math.random()*600,ease:"out(3)",delay:Math.random()*60});
      });
      for(let i=0;i<6;i++)setTimeout(()=>se(c,8,1.3),50+i*80);
      // 重建
      setTimeout(()=>{
        setPh("fix");
        VO_DATA.forEach((v,i)=>{
          const el=frr.current[i];if(!el)return;
          animate(el,{translateX:0,translateY:0,rotate:0,opacity:1,duration:600+Math.random()*300,ease:"outBack(1.7)",delay:Math.random()*80,onComplete:()=>{}});
        });
        setTimeout(()=>{if(img)img.style.display="";setD(0);setPh("idle");},1000);
      },2000);
    }
  },[dmg,ph]);

  // 轨道
  useEffect(()=>{
    const bk=br.current,f=fr.current;if(!bk||!f)return;
    const rs=[];RI.forEach(c=>{const r=document.createElement("div");r.style.cssText=`position:absolute;border-radius:50%;pointer-events:none;width:${c.rx*2}px;height:${c.ry*2}px;left:50%;top:50%;margin-left:-${c.rx}px;margin-top:-${c.ry}px;border:1px solid ${c.ri};`;bk.appendChild(r);rs.push(r);});
    const all=[];RI.forEach(c=>{for(let i=0;i<c.n;i++){const d=document.createElement("div");const s=c.sz;d.style.cssText=`position:absolute;border-radius:50%;pointer-events:none;width:${s}px;height:${s}px;background:${c.c};box-shadow:0 0 ${s*3}px ${s}px ${c.c};left:50%;top:50%;transition:opacity .25s;will-change:transform;`;bk.appendChild(d);all.push({el:d,rx:c.rx,ry:c.ry,sp:c.sp,o:(i/c.n)*Math.PI*2,f:false});}});
    const drv={a:0};const an=animate(drv,{a:Math.PI*2,duration:35000,ease:"linear",loop:true,onUpdate:()=>{const a=drv.a;all.forEach(d=>{const ang=a*d.sp+d.o,ca=Math.cos(ang);d.el.style.translate=`${ca*d.rx}px ${Math.sin(ang)*d.ry}px`;const tf=ca>.05;if(tf&&d.el.parentElement===bk&&!d.f){d.f=true;d.el.style.opacity="0";setTimeout(()=>{f.appendChild(d.el);d.el.style.opacity="";d.f=false;},250);}else if(!tf&&d.el.parentElement===f&&!d.f){d.f=true;d.el.style.opacity="0";setTimeout(()=>{bk.appendChild(d.el);d.el.style.opacity="";d.f=false;},250);}});}});
    return()=>{an.pause();all.forEach(d=>d.el.remove());rs.forEach(r=>r.remove());};
  },[]);

  const gi=dmg/MX;
  const bs=ph==="idle"?(dmg===0?"0 0 25px 4px oklch(0.7 0.2 85/0.2),0 0 60px 10px oklch(0.7 0.2 85/0.08)":`0 0 ${25+gi*40}px ${4+gi*12}px oklch(0.7 ${.2+gi*.25} ${85-gi*50}/${.2+gi*.5}),0 0 ${60+gi*60}px ${10+gi*20}px oklch(0.7 ${.2+gi*.15} ${85-gi*40}/${.08+gi*.35})`):"0 0 50px 15px oklch(0.85 0.35 35/0.8),0 0 120px 35px oklch(0.85 0.35 35/0.4)";

  return (<div className="relative mx-auto mb-10 flex items-center justify-center" style={{width:220,height:220}}>
    <div ref={br} className="absolute inset-0 z-0" />
    <div ref={fr} className="absolute inset-0 z-10 pointer-events-none" />
    <div ref={ar} onClick={hc} className="relative flex items-center justify-center rounded-full cursor-pointer select-none overflow-visible"
      style={{width:SZ,height:SZ,zIndex:1,boxShadow:bs,animation:ph==="idle"&&dmg===0?"breathe-amber 3s ease-in-out infinite":"none"}} role="img" aria-label="avatar">
      {/* Voronoi 碎片层 */}
      <div className="absolute inset-0" style={{clipPath:ph!=="bang"?"circle(50%)":undefined,zIndex:2}}>
        {VO_DATA.map((v,i)=>(
          <div key={i} ref={el=>frr.current[i]=el} className="absolute"
            style={{inset:0,clipPath:v.cp,backgroundImage:`url(${import.meta.env.BASE_URL}avatar.png)`,backgroundSize:`${SZ}px ${SZ}px`,backgroundPosition:`${v.bgX}px ${v.bgY}px`,willChange:"transform"}} />
        ))}
      </div>
      {/* 完整图片（渐隐） */}
      <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none transition-opacity duration-300"
        style={{clipPath:"circle(50%)",zIndex:3,opacity:ph==="idle"?Math.max(0,1-dmg*0.09):ph==="fix"?1:0}}>
        <img src={import.meta.env.BASE_URL+"avatar.png"} alt="" className="h-full w-full object-cover pointer-events-none" draggable={false} />
      </div>
      {/* 伤害光晕 */}
      {dmg>0&&ph==="idle"&&(<div className="absolute inset-0 rounded-full pointer-events-none" style={{zIndex:1,background:`radial-gradient(circle at 50% 50%,oklch(${0.7+gi*.2} 0.3 ${55-gi*30}/${0.1+gi*.35}) 0%,transparent ${55-gi*18}%)`,mixBlendMode:"screen"}} />)}
    </div>
  </div>);
}
