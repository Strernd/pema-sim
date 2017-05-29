import {Timeslot} from './Timeslot';
import {CFG} from './CFG';
import { Arrow } from './Arrow';
import { Scenario } from './Scenario';



import Prob = require('prob.js');
import Random = require('random-js');

const source = (Random.engines.mt19937().seed(CFG.SEED));

export class Truck{
    dispatched: boolean;
    late: boolean;
    arrived: boolean;
    row: number;
    scene: Scenario​​;
    paper: any;
    color: string;
    arrow: any;
    id: number;
    preferredTime: number;
    adoptsRealtime: boolean;
    adoptsSuggestion: boolean;
    start: number;
    totalWay : number;
    arrivalReal: number;
    arrivalPlanned: number;
    arrivalPredicted: number;
    waitingTime: number;
    latestArrivalForDispatch: number;
    public delay: number;
    domElement: any;
    slot: Timeslot;

    constructor(scene: Scenario, id: number, totalWay: number){
        this.slot = null;
        this.scene = scene;
        this.id = id;
        let x = Prob.uniform(0,1)(source);
        this.adoptsRealtime = false;
        if (x <= CFG.ADOPTION_RATE) this.adoptsRealtime = true;
        this.totalWay = Math.round(totalWay);
        let fr = Prob.exponential(CFG.TRUCK_DELAY_LAMBDA);
        let r = fr(source);
        let sign = Prob.uniform(0,1)(source);
        if(sign < CFG.LATE_EARLY_DIST){
            sign = -1;
        }
        else{
            sign = 1;
        }
        this.delay = Math.round(sign * r * CFG.DELAY_FACTOR * this.totalWay);
        fr = Prob.uniform(0,CFG.QUANT_TRUCKS*CFG.TIMESLOT_LEN);
        this.preferredTime = Math.round(fr(source));
        this.arrived = false;
        this.dispatched = false;
        this.late = false;
        
    }

    public assign(slot: Timeslot){
        if(this.slot == null){
            this.slot = slot;
            const safetytime = Prob.uniform(CFG.TRUCK_SAFETY_START_TIME_MIN,CFG.TRUCK_SAFETY_START_TIME_MAX)(source);
            this.arrivalPlanned = Math.round(this.slot.from - safetytime);
            this.start =  Math.round(this.arrivalPlanned - this.totalWay);
            this.arrivalReal = Math.round(this.start + this.totalWay + this.delay);
            this.latestArrivalForDispatch = Math.round(this.slot.to - CFG.TRUCK_DISPATCH_TIME);
        }
        else{
            this.slot = slot;
            this.latestArrivalForDispatch = Math.round(this.slot.to - CFG.TRUCK_DISPATCH_TIME);
        }

    }

    public calculatePredictedArrival(t: number){
        if(!this.adoptsRealtime){
            this.arrivalPredicted = this.slot.from;
            return this.arrivalPredicted;            
        }
        if(t <= this.start){
            this.arrivalPredicted = this.slot.from;
        }
        if(t > this.start){
            let relWay = (t-this.start) / (this.arrivalReal-this.start);
            let knownDelay = relWay * this.delay;
            this.arrivalPredicted = this.start + this.totalWay + knownDelay;
        }
        if(t > this.arrivalReal){
            this.arrivalPredicted = this.arrivalReal;
        }
        return this.arrivalPredicted;
    }

    public determineReallocation(t: Number){
        if(!this.late && (this.arrivalPredicted > this.latestArrivalForDispatch)){
            console.log("Truck "+this.id+ " will be late");
            this.late = true;
            this.slot.willBeMissed = true;
        }
        if(this.late && (this.arrivalPredicted <= this.latestArrivalForDispatch)){
            this.late = false;
            this.slot.willBeMissed = false;
            console.log("Truck "+this.id+ " will not be late any more");
        }
        if(t >= this.arrivalReal){
            this.arrived = true;
        }
        if(!this.late && this.arrived){
            this.dispatched = true;
        }
        this.waitingTime = this.slot.from - this.arrivalPredicted;
        if(this.waitingTime < 0){
            this.waitingTime = Number.MAX_VALUE;
        }
    }


    public setDomElement(domElement){
        this.domElement = domElement;
        domElement.mousedown(()=>{
            this.mouseover();
            domElement.mouseup(()=>{this.mouseout()});
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
        content += " P"+Math.round(this.arrivalPredicted);
        
        content += "</p>";
        this.domElement.html(content);

    }

    public setArrow(arrow: Arrow){
        this.arrow = arrow;
    }

    private mouseover(){
        this.domElement.addClass("hovered");
        this.arrow.setColor(CFG.COLORS.BLUE);
        this.slot.block.setColor(CFG.COLORS.BLUE,CFG.COLORS.BLACK);
    }

    private mouseout(){
        this.arrow.setColor(this.color);
        this.slot.block.setColor(this.color,CFG.COLORS.BLACK);
        this.domElement.removeClass("hovered");
    }

    public setPaper(paper){
        this.paper = paper;
        this.arrow = new Arrow(this.paper);
        
    }

    public updateArrow(){
        let arrow = this.arrow;
        this.color = CFG.COLORS.GREEN;
        let x1 = this.arrivalReal;
        let x2 = this.slot.from;
        let i = this.row;
        let y = CFG.TIMESLOT_LEN * 3 + 25 * i;
        let late = (x1 > this.latestArrivalForDispatch);
        if (late) this.color = CFG.COLORS.RED;
        if (this.late) this.color = CFG.COLORS.ORANGE;
        if (x1 > x2 && x1 < this.latestArrivalForDispatch) x2 = this.latestArrivalForDispatch;
        if(Math.abs(x1-x2) < 5){
            x1 -= 5;
        }
        arrow.setColor(this.color);
        arrow.setFrom({x: x1, y});
        arrow.setTo({x: x2, y});
        arrow.setWidth(3);
        this.arrow = arrow;
    }
}