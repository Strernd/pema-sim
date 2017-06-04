import {Timeslot} from './Timeslot';
import {CFG} from './CFG';
import { Arrow } from './Arrow';
import { Scenario } from './Scenario';
import Prob = require('prob.js');
import Random = require('random-js');
import * as $ from 'jquery';


export class Truck{
    changed: false;
    dispatched: boolean;
    late: boolean;
    arrived: boolean;
    row: number;
    scene: Scenario;
    source : any;
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
    force: boolean;
    bookedSlot: Timeslot;
    initiallyLate: boolean;

    constructor(scene: Scenario, id: number, totalWay: number){
        this.force = true;
        this.slot = null;
        this.bookedSlot = null;
        this.scene = scene;
        this.source = scene.source;
        this.id = id;
        let x = Prob.uniform(0,1)(this.source);
        this.adoptsRealtime = false;
        if (x <= CFG.ADOPTION_RATE) this.adoptsRealtime = true;
        this.totalWay = Math.round(totalWay);
        if(CFG.TRUCK_DELAY_EXPT){
            let fr = Prob.exponential(CFG.TRUCK_DELAY_LAMBDA);
            let r = fr(this.source);
            let sign = Prob.uniform(0,1)(this.source);
            if(sign < CFG.LATE_EARLY_DIST){
                sign = -1;
            }
            else{
                sign = 1;
            }
            this.delay = Math.round(sign * r * CFG.DELAY_FACTOR * this.totalWay);
        }
        else{
            let fr = Prob.normal(CFG.TRUCK_DELAY_MU,CFG.TRUCK_DELAY_SIGMA);
            this.delay = Math.round(fr(this.source) * CFG.DELAY_FACTOR * this.totalWay)
            
        }

        let fr = Prob.uniform(0,CFG.QUANT_TRUCKS*CFG.TIMESLOT_LEN);
        this.preferredTime = Math.round(fr(this.source));
        this.arrived = false;
        this.dispatched = false;
        this.late = false;
        this.changed = false;
        
    }

    public setEvents(){
        this.arrow.element.click(() => {
            this.select();
        });
    }


    public assign(slot: Timeslot){
        if(this.slot == null){
            this.slot = slot;
            const safetytime = Prob.uniform(CFG.TRUCK_SAFETY_START_TIME_MIN,CFG.TRUCK_SAFETY_START_TIME_MAX)(this.source);
            this.arrivalPlanned = Math.round(this.slot.from - safetytime);
            this.start =  Math.round(this.arrivalPlanned - this.totalWay);
            this.arrivalReal = Math.round(this.start + this.totalWay + this.delay);
            this.latestArrivalForDispatch = Math.round(this.slot.to - CFG.TRUCK_DISPATCH_TIME);
            this.initiallyLate = (this.arrivalReal > this.latestArrivalForDispatch);
            this.setEvents();
        }
        else{
            this.slot = slot;
            this.latestArrivalForDispatch = Math.round(this.slot.to - CFG.TRUCK_DISPATCH_TIME);

        }
        if(this.bookedSlot === null) this.bookedSlot = slot;
        this.calculateWaitingTime();
    }

    private calculateWaitingTime(){
        if(this.arrivalReal <= this.slot.from) {
            // Before Slot begins
            this.waitingTime = this.slot.from - this.arrivalReal;
        }
        else{
            if(this.arrivalReal <= this.slot.latest){
                // After slot begins but still in time for dispatching
                this.waitingTime = 0;
            }
            else{
                // Missed slot
                this.waitingTime = (CFG.TIME_OFFSET + CFG.QUANT_TIMESLOTS * CFG.TIMESLOT_LEN) - this.arrivalReal;
            }
        }

    }

    public unassign(){
        this.slot = null;
    }

    public calculatePredictedArrival(t: number){
        if(!this.adoptsRealtime){
            this.arrivalPredicted = this.slot.from;
            if(this.scene.time > this.arrivalReal){
                this.arrivalPredicted = this.arrivalReal;
            }
            return this.arrivalPredicted;            
        }
        if(t <= this.start){
            this.arrivalPredicted = this.slot.from;
        }
        if(t > this.start){
            let relWay = (t-this.start) / (this.arrivalReal-this.start);
            let knownDelay = relWay * this.delay;
            this.arrivalPredicted = Math.round(this.start + this.totalWay + knownDelay);
        }
        if(t > this.arrivalReal){
            this.arrivalPredicted = this.arrivalReal;
        }
        return this.arrivalPredicted;
    }

    public calculateProperties(){
        let predictedLaterThanLatest = (this.arrivalPredicted > this.latestArrivalForDispatch);
        let timeAfterLatest = (this.scene.time > this.latestArrivalForDispatch );
        let trueLate = (this.arrivalReal > this.latestArrivalForDispatch);
        if(!this.late){
            if (predictedLaterThanLatest || (timeAfterLatest && trueLate)){
                this.late = true;
                this.slot.willBeMissed = true;
            }
        }
        if(this.late){
            if(!predictedLaterThanLatest && !(timeAfterLatest && trueLate)){
                this.late = false;
                this.slot.willBeMissed = false;
                // console.log("Truck "+this.id+ " will not be late any more");
            }
        }
        if(this.scene.time >= this.arrivalReal){
            this.arrived = true;
        }
        if(!this.late && this.arrived){
            this.dispatched = true;
        }

    }

    public setDomElement(domElement){
        this.domElement = domElement;
        domElement.mousedown(()=>{
            this.mouseover();
            domElement.mouseup(()=>{this.mouseout()});
        });
    }

    public getDetail(){
        let content = "<p>";
        content += span("id","Truck #",this.id);
        content += span("start", "Start",this.start);
        content += span("way","Wegstrecke",this.totalWay);
        content += span("planned", "Ankunft geplant", this.arrivalPlanned);
        content += span("real", "Ankunft Ist", this.arrivalReal);
        content += span("latest", "Ankunft spätestens", this.latestArrivalForDispatch);
        content += span("predicted", "Ankunft voraussichtlich",this.arrivalPredicted);
        content += span("delay","Verspätung",this.delay);
        content += span("waiting","Wartezeit",this.waitingTime);
        content += span("late","Known Late",this.late);
        content += span("late","Late",(this.arrivalReal > this.latestArrivalForDispatch));
        
        content += "</p>";
        return content;
    }

    public select(){
        let l = this.scene.selected;
        if(l !== null){
            l.arrow.setColor(l.color);
            l.slot.block.setColor(l.color,CFG.COLORS.BLACK);
        }
        this.scene.selected = this;
        this.arrow.setColor(CFG.COLORS.BLUE);
        this.slot.block.setColor(CFG.COLORS.BLUE,CFG.COLORS.BLACK);
        $('#truck-info').html(this.getDetail());
        
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
            let y;
            if (CFG.INDIVIDUAL_ROWS){
                let i = this.row;
                y = (CFG.TIMESLOT_LEN * 3 + 20 * i);
            }
            else{
                let i = this.id;
                y = (CFG.TIMESLOT_LEN * 3 + 10 * i);
            }
            let late = (x1 > this.latestArrivalForDispatch);
            if (late) this.color = CFG.COLORS.RED;
            if (this.late) this.color = CFG.COLORS.ORANGE;
            if (x1 > x2 && x1 < this.latestArrivalForDispatch) x2 = this.latestArrivalForDispatch;
            if(Math.abs(x1-x2) < 8){
                x1 -= 8;
            }
            if(this.force || this.color !== arrow.color) arrow.setColor(this.color)
            if(this.force || x1 !== arrow.from.x || y !== arrow.from.y || x2 !== arrow.to.x){
                arrow.setFrom({x: x1, y});
                arrow.setTo({x: x2, y});
            }
            if(this.force || arrow.width !== 5) arrow.setWidth(5);
            this.arrow = arrow;
            this.force = false;

    }
}

function span(cl: String, content: String, value: any): String{
    return "<span class='"+cl+"'>"+content+": "+String(value)+"</span>";
}