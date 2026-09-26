const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const root = path.resolve(__dirname, "..");
const input = path.join(root, "assets", "characters", "sprites.png");
const output = path.join(root, "assets", "characters", "frames");
const names = ["ufo", "cat", "dog", "deer", "cow", "human"];
const rowBounds = [0, 230, 390, 540, 690, 845, 1024];
const columnBounds = [
  [0, 240, 440, 660, 856, 1046, 1205, 1370, 1536],
  [0, 237, 440, 639, 839, 1023, 1188, 1356, 1536],
  [0, 233, 431, 632, 828, 1013, 1195, 1368, 1536],
  [0, 235, 438, 642, 839, 1022, 1195, 1364, 1536],
  [0, 228, 435, 638, 840, 1038, 1207, 1370, 1536],
  [0, 206, 414, 621, 823, 1013, 1182, 1348, 1536]
];

async function main() {
  fs.mkdirSync(output, { recursive: true });
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let row = 0; row < names.length; row++) {
    for (let col = 0; col < 8; col++) {
      const left = columnBounds[row][col], right = columnBounds[row][col + 1];
      let top = rowBounds[row], bottom = rowBounds[row + 1];
      if (row === 1 && col === 7) top = 241; // UFOビームの末端を除外
      if (row === 4 && col === 7) bottom = 826; // 次行の帽子を除外
      let minX=right,minY=bottom,maxX=left,maxY=top;
      for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(data[(y*info.width+x)*4+3]>10){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y)}
      const width=maxX-minX+1,height=maxY-minY+1,size=Math.max(width,height);
      const padX = Math.floor((size - width) / 2), padY = size - height;
      const file = path.join(output, `${names[row]}-${col + 1}.png`);
      const squared = await sharp(input).extract({left:minX,top:minY,width,height})
        .extend({ top: padY, bottom: 0, left: padX, right: size - width - padX, background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png().toBuffer();
      await sharp(squared).resize(256,256,{fit:"fill"}).png().toFile(file);
      console.log(`${names[row]}-${col + 1}: cell ${right-left}x${bottom-top}, artwork ${width}x${height}`);
    }
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
