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
const paper = Raphael("paper", (CFG.QUANT_TIMESLOTS * CFG.TIMESLOT_LEN  + 250 ) * CFG.SCALE, 400 * CFG.SCALE);
const width = CFG.TIMESLOT_LEN;
const app = $('#app');
const scene = new Scenario(paper,CFG.SEED);
let play = false;

$(document).keypress(function(e){
  e.preventDefault();
   if(e.keyCode === 0 || e.keyCode === 32){
     play = !play;
   }
   });
window.requestAnimationFrame(step);



const timeline = paper.path("M"+scene.time+",0L"+scene.time+",400");
timeline.attr("stroke",CFG.COLORS.ORANGE);
timeline.attr("stroke.width",1);
const speed = 1000;

let last = 0;
const latest = CFG.TIME_OFFSET + CFG.TIMESLOT_LEN * CFG.QUANT_TIMESLOTS;
function step(timestamp) {
  let delta = timestamp - last;
    window.requestAnimationFrame(step);
  if (delta > (1000/speed)) {
      if(play){
      scene.advance();
      timeline.attr("path","M"+scene.time*CFG.SCALE+",0L"+scene.time*CFG.SCALE+",400");
      if(scene.time > latest) { play = false};
      }
    last = timestamp;
  }
}


}


document.addEventListener('DOMContentLoaded', fn, false);