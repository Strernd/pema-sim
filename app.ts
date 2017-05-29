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


function fn(){
// Creates canvas 320 × 200 at 10, 50
const paper = Raphael("paper", 1200, 400);
const width = CFG.TIMESLOT_LEN;
const app = $('#app');

scene.timeslots.forEach((timeslot) => {
    let block = new Block(paper,{x: timeslot.from, y:0},width,width*2);
        block.setColor(CFG.COLORS.GREEN,CFG.COLORS.BLACK);
    if(timeslot.truck.arrivalReal > timeslot.truck.latestArrivalForDispatch){
        block.setColor(CFG.COLORS.RED,CFG.COLORS.BLACK);
    }
    timeslot.setBlock(block);
    
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
    let domEl = $("<div class='truck'></div>");
    app.append(domEl);
    truck.setDomElement(domEl);
    truck.setDomContent();
    let arrow = new Arrow(paper);
    arrow.setColor(CFG.COLORS.GREEN);
    let x1 = truck.arrivalReal;
    let x2 = truck.slot.from;
    let i = fitInRow(Math.min(x1,x2),Math.max(x1,x2));
    let y = width * 3 + 25 * i;
    let late = (x1 > truck.latestArrivalForDispatch);
    if (late) arrow.setColor(CFG.COLORS.RED);
    if (x1 > x2 && x1 < truck.latestArrivalForDispatch) x2 = truck.latestArrivalForDispatch;
    if(Math.abs(x1-x2) < 5){
        x1 -= 5;
    }
    arrow.setFrom({x: x1, y});
    arrow.setTo({x: x2, y});
    arrow.setWidth(3);
    truck.setArrow(arrow);
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