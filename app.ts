import * as Raphael from 'raphael';
import { Point } from './objects';
import { Arrow } from './Arrow';
import { Block } from './Block';

const COLORS = {
    GREY: "#9E9E9E",
    LIGHTGREY: "#B0BEC5",
    GREEN: "#4CAF50",
    BLUE: "#2196F3",
    RED: "#f44336",
    YELLOW: "#FFEB3B",
    ORANGE: "#FF9800",
    BLACK: "#212121"
}

function fn(){
// Creates canvas 320 × 200 at 10, 50
const paper = Raphael(10, 10, 1001, 600);
const width = 25;


for (let i = 0; i <40; i++){
    let b = new Block(paper, {x: (i*width)+5, y:0},(width-5),(width*2));
    b.setColor(COLORS.LIGHTGREY,COLORS.BLACK);

    let a = new Arrow(paper);
    a.setColor(COLORS.BLACK);
    a.setWidth(1);
    a.setFrom({x: (i*width)-(width/2), y: 10*(i % 4) + (width*2 + 20)})
    a.setLength(width);
        b.element.mouseover(()=>{
        b.setColor(COLORS.GREEN,COLORS.BLACK);
        a.setWidth(3);
});

    b.element.mouseout(()=>{
        b.setColor(COLORS.LIGHTGREY,COLORS.BLACK);
        a.setWidth(1);
    });

 b.element.click(()=>{
        b.setColor(COLORS.RED,COLORS.BLACK);
        a.setColor(COLORS.RED); });
}




window.requestAnimationFrame(step);


let last = 0;
function step(timestamp) {
  let delta = timestamp - last;
    window.requestAnimationFrame(step);
  
  if (delta > (1000/60)) {
      
    last = timestamp;
    
  }
}


}


document.addEventListener('DOMContentLoaded', fn, false);