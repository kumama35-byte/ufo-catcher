const path=require("path"),fs=require("fs"),sharp=require("sharp");
const root=path.resolve(__dirname,".."),input=path.join(root,"assets","characters","sprites-human.png"),output=path.join(root,"assets","characters","frames-human");
const names=["human_farmer","human_schoolgirl","human_worker","human_student"],xs=[0,316,631,947,1262],ys=[0,345,630,925,1246];
async function main(){
  fs.mkdirSync(output,{recursive:true});
  const{data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){
    const left=xs[col],right=xs[col+1],top=ys[row],bottom=ys[row+1];let minX=right,minY=bottom,maxX=left,maxY=top;
    for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(data[(y*info.width+x)*4+3]>10){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y)}
    const width=maxX-minX+1,height=maxY-minY+1,size=Math.max(width,height),padX=Math.floor((size-width)/2),padY=size-height;
    const squared=await sharp(input).extract({left:minX,top:minY,width,height}).extend({top:padY,bottom:0,left:padX,right:size-width-padX,background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
    const file=path.join(output,`${names[row]}-${col+1}.png`);await sharp(squared).resize(256,256,{fit:"fill"}).png().toFile(file);
    console.log(`${names[row]}-${col+1}: artwork ${width}x${height}`);
  }
}
main().catch(error=>{console.error(error);process.exitCode=1});
