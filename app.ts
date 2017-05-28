import * as Raphael from 'raphael';
import { Point } from './objects';
import { Arrow } from './Arrow';
import { Block } from './Block';
import { Truck } from './Truck';
import { Scenario } from './Scenario';
import { CFG } from './CFG';

import * as $ from 'jquery';

const scene = new Scenario();
const trucks = scene.trucks;

// $( document ).ready(() => {
// const app = $('#app');
// trucks.forEach(truck => {
//     let content = "<p>";
//     content += "Start: "+Math.round(truck.start)+"<br>";
//     content += "SOLL Ankunft : "+Math.round(truck.arrivalPlanned)+"<br>";
//     content += "IST Ankunft  : "+Math.round(truck.arrivalReal)+"<br>";
//     content += "Verzgerung : " +Math.round(truck.delay); 
//     content += "</p>";
//     let cl = "'truck ";
//     if (truck.arrivalReal > truck.arrivalPlanned) cl += "late"
//     cl += "'";
//     app.append("<div class="+cl+">"+ content +"</div>");
// });

// });


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
const paper = Raphael(10, 10, 1500, 600);
const width = CFG.TIMESLOT_LEN;

scene.timeslots.forEach((timeslot) => {
    let block = new Block(paper,{x: timeslot.from, y:0},width,width*2);
        block.setColor(COLORS.GREEN,COLORS.BLACK);
    if(timeslot.truck.arrivalReal > timeslot.truck.latestArrivalForDispatch){
        block.setColor(COLORS.RED,COLORS.BLACK);
    }
    
});
const truck = scene.trucks;
trucks.sort((a,b) => {
    return Math.min(a.arrivalReal, a.slot.from) - Math.min(b.arrivalReal,b.slot.from);
});
console.log(trucks);
let rows = [[]];
let space = 5;
function fitInRow(x1,x2){
    for (let i = 0; i< rows.length; i++){
        let row = rows[i];
        if(row.length > 0){
            let last = row[row.length - 1]
            if(last + 5 < x1 ){
                row.push(x2);
                rows[i] = row;
                return i;
            }
        }
        else{
            row.push(x2);
            rows[i] = row;
            return i;
        }
    }
    rows.push([x2]);
    return rows.length - 1;
}
trucks.forEach((truck, index) => {
    let arrow = new Arrow(paper);
    arrow.setColor(COLORS.GREEN);
    let x1 = truck.arrivalReal;
    let x2 = truck.slot.from;
    let i = fitInRow(Math.min(x1,x2),Math.max(x1,x2));
    let y = width * 3 + 25 * i;
    let late = (x1 > truck.latestArrivalForDispatch);
    if (late) arrow.setColor(COLORS.RED);
    if (x1 > x2 && x1 < truck.latestArrivalForDispatch) x2 = truck.latestArrivalForDispatch;
    if(Math.abs(x1-x2) < 5){
        x1 -= 5;
    }
    arrow.setFrom({x: x1, y});
    arrow.setTo({x: x2, y});
    arrow.setWidth(3);
});
console.log(rows);
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