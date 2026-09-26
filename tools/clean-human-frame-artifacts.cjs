const path=require("path"),sharp=require("sharp");

const root=path.resolve(__dirname,".."),frames=path.join(root,"assets","characters","frames-human");
const targets=["human_ol-3.png","human_schoolgirl-3.png"];

async function clean(file){
  const input=path.join(frames,file),{data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const {width,height,channels}=info,seen=new Uint8Array(width*height),components=[];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const start=y*width+x;if(seen[start]||data[start*channels+3]<=10)continue;
    const stack=[start],pixels=[];seen[start]=1;
    while(stack.length){
      const index=stack.pop(),px=index%width,py=Math.floor(index/width);pixels.push(index);
      for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
        if(!ox&&!oy)continue;const nx=px+ox,ny=py+oy;if(nx<0||ny<0||nx>=width||ny>=height)continue;
        const next=ny*width+nx;if(!seen[next]&&data[next*channels+3]>10){seen[next]=1;stack.push(next)}
      }
    }
    components.push(pixels);
  }
  components.sort((a,b)=>b.length-a.length);const main=components[0]||[],removed=components.slice(1).reduce((sum,part)=>sum+part.length,0);
  for(const part of components.slice(1))for(const index of part)data[index*channels+3]=0;
  await sharp(data,{raw:info}).png().toFile(`${input}.clean.png`);await sharp(`${input}.clean.png`).toFile(input);require("fs").unlinkSync(`${input}.clean.png`);
  console.log(`${file}: kept ${main.length}px, removed ${removed}px`);
}

Promise.all(targets.map(clean)).catch(error=>{console.error(error);process.exitCode=1});
