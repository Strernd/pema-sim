import * as Raphael from 'raphael';
import { Point } from './objects';
import { Arrow } from './Arrow';
import { Block } from './Block';
import { Truck } from './Truck';
import { Scenario } from './Scenario';
import { CFG } from './CFG';

import * as $ from 'jquery';



function fn(){
// Creates canvas 320 × 200 at 10, 50
const paper = Raphael("paper", 1200, 400);
const width = CFG.TIMESLOT_LEN;
const app = $('#app');
const scene = new Scenario(paper);

let play = false;
$('#play').click(()=> play = true);
$('#pause').click(()=> play = false);


scene.trucks.forEach((truck, index) => {
    let domEl = $("<div class='truck'></div>");
    app.append(domEl);
    truck.setDomElement(domEl);
    truck.setDomContent();
    
});
window.requestAnimationFrame(step);


const timeline = paper.path("M"+scene.time+",0L"+scene.time+",400");
timeline.attr("stroke",CFG.COLORS.ORANGE);
timeline.attr("stroke.width",1);
const speed = 30;

let last = 0;
function step(timestamp) {
  let delta = timestamp - last;
    window.requestAnimationFrame(step);
  
  if (delta > (1000/speed)) {
      if(play){
      scene.advance();
      timeline.attr("path","M"+scene.time+",0L"+scene.time+",400");
      }

      
    last = timestamp;
    
  }
}


}


document.addEventListener('DOMContentLoaded', fn, false);