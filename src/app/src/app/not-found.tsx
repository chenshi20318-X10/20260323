'use client';

import { useMemo, useRef, useState } from 'react';

type Item = { id: string; url: string; name: string };

export default function Page() {
  const [items, setItems] = useState<Item[]>([]);
  const [title, setTitle] = useState('今日灵感参考');
  const [notes, setNotes] = useState<Record<number, string>>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rows = useMemo(() => {
    const out: Item[][] = [];
    for (let i = 0; i < items.length; i += 4) out.push(items.slice(i, i + 4));
    return out;
  }, [items]);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const next = Array.from(files).filter((f) => f.type.startsWith('image/')).map((file) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setItems((old) => [...old, ...next]);
  }

  async function drawAndDownload() {
    const canvas = canvasRef.current;
    if (!canvas || !items.length) return;
    const w = 1080, gap = 18, pad = 48, tileW = (w - pad * 2 - gap * 3) / 4, tileH = tileW * 4 / 3;
    const rowH = tileH + 142;
    canvas.width = w;
    canvas.height = 190 + rows.length * rowH + 48;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#faf7f0'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1f2421'; ctx.fillRect(0, 0, w, 150);
    ctx.fillStyle = '#f4c95d'; ctx.font = '700 46px system-ui'; ctx.fillText(title, pad, 82);
    ctx.fillStyle = '#f7efe0'; ctx.font = '24px system-ui'; ctx.fillText('小红书 / Ins 审美灵感横向参考', pad, 122);

    for (let r = 0; r < rows.length; r++) {
      const y = 190 + r * rowH;
      ctx.fillStyle = '#20211f'; ctx.font = '700 28px system-ui'; ctx.fillText(`参考 ${r + 1}`, pad, y - 20);
      for (let c = 0; c < 4; c++) {
        const x = pad + c * (tileW + gap);
        ctx.fillStyle = '#fff'; ctx.fillRect(x, y, tileW, tileH);
        ctx.strokeStyle = '#e3ded2'; ctx.strokeRect(x, y, tileW, tileH);
        const item = rows[r][c];
        if (!item) continue;
        const img = await new Promise<HTMLImageElement>((resolve) => { const im = new Image(); im.onload = () => resolve(im); im.src = item.url; });
        const scale = Math.min(tileW / img.width, tileH / img.height);
        const iw = img.width * scale, ih = img.height * scale;
        ctx.drawImage(img, x + (tileW - iw) / 2, y + (tileH - ih) / 2, iw, ih);
      }
      ctx.fillStyle = '#393a35'; ctx.font = '22px system-ui';
      ctx.fillText(notes[r] || '请在页面中补充这一组的灵感描述，建议聚焦构图、色调、材质、排版节奏。', pad, y + tileH + 46);
    }
    const a = document.createElement('a');
    a.download = `${title}-长图.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  }

  return <main style={{minHeight:'100vh',background:'#f7f5ef',padding:24,fontFamily:'system-ui',color:'#20211f'}}>
    <section style={{display:'flex',justifyContent:'space-between',gap:16,alignItems:'center',marginBottom:18}}>
      <div><h1 style={{margin:0,fontSize:36}}>{title}</h1><p style={{margin:'8px 0 0',color:'#73746f'}}>上传图片后按每排 4 张横向拼接，末排不足自动补白。</p></div>
      <button onClick={drawAndDownload} disabled={!items.length} style={{height:42,padding:'0 18px',border:0,borderRadius:8,background:items.length?'#0f766e':'#ddd',color:'#fff'}}>下载长图</button>
    </section>
    <section style={{display:'grid',gridTemplateColumns:'320px 1fr',gap:18}}>
      <aside style={{background:'#fff',border:'1px solid #dedbd1',borderRadius:8,padding:18}}>
        <label>标题<input value={title} onChange={(e)=>setTitle(e.target.value)} style={{width:'100%',height:40,margin:'8px 0 16px'}} /></label>
        <input type="file" accept="image/*" multiple onChange={(e)=>addFiles(e.target.files)} />
        <p style={{color:'#73746f'}}>已上传 {items.length} 张，共 {rows.length} 组参考。</p>
      </aside>
      <section style={{display:'grid',gap:18}}>{rows.map((row, r) => <article key={r} style={{background:'#fff',border:'1px solid #dedbd1',borderRadius:8,padding:18}}>
        <h2 style={{marginTop:0}}>参考 {r + 1}</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>{[0,1,2,3].map((i)=><div key={i} style={{aspectRatio:'3/4',background:'#fff',border:'1px solid #eee',display:'grid',placeItems:'center',overflow:'hidden'}}>{row[i] ? <img src={row[i].url} alt="" style={{maxWidth:'100%',maxHeight:'100%'}}/> : null}</div>)}</div>
        <textarea value={notes[r] || ''} onChange={(e)=>setNotes({...notes,[r]:e.target.value})} placeholder="输入这一组参考的风格描述" style={{width:'100%',minHeight:76,marginTop:12}} />
      </article>)}</section>
    </section>
    <canvas ref={canvasRef} hidden />
  </main>;
}
