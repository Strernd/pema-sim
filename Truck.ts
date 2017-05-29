import {Timeslot} from './Timeslot';
import {CFG} from './CFG';
import { Arrow } from './Arrow';


import Prob = require('prob.js');
import Random = require('random-js');

const source = (Random.engines.mt19937().seed(CFG.SEED));

export class Truck{
    colorBefore: string;
    arrow: any;
    id: number;
    preferredTime: number;
    realtime: boolean;
    start: number;
    totalWay : number;
    arrivalReal: number;
    arrivalPlanned: number;
    latestArrivalForDispatch: number;
    public delay: number;
    domElement: any;
    slot: Timeslot;

    constructor(id: number, totalWay: number){
        this.id = id;
        let x = Prob.uniform(0,1)(source);
        this.realtime = false;
        if (x <= CFG.ADOPTION_RATE) this.realtime = true;
        this.totalWay = totalWay;
        let fr = Prob.exponential(CFG.TRUCK_DELAY_LAMBDA);
        let r = fr(source);
        let sign = Prob.uniform(0,1)(source);
        if(sign < CFG.LATE_EARLY_DIST){
            sign = -1;
        }
        else{
            sign = 1;
        }
        this.delay = sign * r * CFG.DELAY_FACTOR * this.totalWay;
        fr = Prob.uniform(0,CFG.QUANT_TRUCKS*CFG.TIMESLOT_LEN);
        this.preferredTime = fr(source);
    }

    public assign(slot: Timeslot){
        this.slot = slot;
        const safetytime = Prob.uniform(CFG.TRUCK_SAFETY_START_TIME_MIN,CFG.TRUCK_SAFETY_START_TIME_MAX)(source);
        this.arrivalPlanned = this.slot.from - safetytime
        this.start =  this.arrivalPlanned - this.totalWay;
        this.arrivalReal = this.arrivalPlanned + this.delay;
        this.latestArrivalForDispatch = this.slot.to - CFG.TRUCK_DISPATCH_TIME;
    }

    public calculateDelay(){

    }

    public setDomElement(domElement){
        this.domElement = domElement;
        domElement.mouseover(()=>{
            this.mouseover()
            domElement.mouseout(()=>{this.mouseout()});
        });
    }

    public setDomContent(){
        let content = "<p>";
        content += "I"+Math.round(this.id);
        content += " S"+Math.round(this.start);
        content += " W"+Math.round(this.totalWay);
        content += " P"+Math.round(this.arrivalPlanned)+"<br>";
        content += "R"+Math.round(this.arrivalReal);
        content += " L"+Math.round(this.latestArrivalForDispatch);
        content += " D"+Math.round(this.delay);
        content += "</p>";
        this.domElement.html(content);

    }

    public setArrow(arrow: Arrow){
        this.arrow = arrow;
    }

    private mouseover(){
        this.domElement.addClass("hovered");
        this.colorBefore = this.arrow.color;
        this.arrow.setColor(CFG.COLORS.BLUE);
        this.slot.block.setColor(CFG.COLORS.BLUE,CFG.COLORS.BLACK);
    }

    private mouseout(){
        this.arrow.setColor(this.colorBefore);
        this.slot.block.setColor(this.colorBefore,CFG.COLORS.BLACK);
        this.domElement.removeClass("hovered");
    }
}