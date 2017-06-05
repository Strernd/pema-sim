import {Timeslot} from './Timeslot';
import {CFG} from './CFG';
import { Arrow } from './Arrow';
import { Scenario } from './Scenario';
import Prob = require('prob.js');
import Random = require('random-js');
import * as $ from 'jquery';


export class Truck{
    scene: Scenario;
    id: number;
    totalWay : number;
    slot: Timeslot;
    bookedSlot: Timeslot;

    delay: number;
    start: number;
    arrivalReal: number;
    arrivalPlanned: number;
    arrivalPredicted: number;
    arrivalLatest: number;
    waitingTime: number;
    
    dispatched: boolean;
    latePredicted: boolean;
    lateReal: boolean;
    arrived: boolean;
    adoptsRealtime: boolean;
    initiallyLate: boolean;

    color: string;

    row: number;
    source : any;
    paper: any;
    arrow: any;
    domElement: any;

    constructor(scene: Scenario, id: number, totalWay: number){
        this.scene = scene;
        this.source = scene.source;
        this.id = id;
        this.totalWay = Math.round(totalWay);

        this.calculateDelay();
        this.setDefaults();
    }

    private setDefaults(){
        this.slot = null;
        this.bookedSlot = null;
        let x = Prob.uniform(0,1)(this.source);
        this.adoptsRealtime = false;
        if (x <= CFG.ADOPTION_RATE) this.adoptsRealtime = true;
        this.arrived = false;
        this.dispatched = false;
        this.latePredicted = false;
        this.lateReal = false;
    }

    private calculateDelay(){
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
    }

    private setEvents(){
        this.arrow.element.click(() => {
            this.select();
        });
    }

    public assign(slot: Timeslot){
        if(this.slot == null){
            this.slot = slot;
            this.bookedSlot = slot;
            this.onInitialSlotAssign();
        }
        else{
            this.slot = slot;
        }
        this.onEverySlotAssign();
    }

    public unassign(){
        this.slot = null;
    }

    private onInitialSlotAssign(){
        const safetytime = Prob.uniform(CFG.TRUCK_SAFETY_START_TIME_MIN,CFG.TRUCK_SAFETY_START_TIME_MAX)(this.source);
        this.arrivalPlanned = Math.round(this.slot.from - safetytime);
        this.start =  Math.round(this.arrivalPlanned - this.totalWay);
        this.arrivalReal = Math.round(this.start + this.totalWay + this.delay);
        this.arrivalLatest = Math.round(this.slot.to - CFG.TRUCK_DISPATCH_TIME);
        this.initiallyLate = (this.arrivalReal > this.arrivalLatest);
        this.bookedSlot = this.slot;
        this.setEvents();
    }

    private onEverySlotAssign(){
        this.arrivalLatest = Math.round(this.slot.to - CFG.TRUCK_DISPATCH_TIME);
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
                const appendedTrucks = this.scene.trucks.filter(x => {
                    return (x.arrivalReal > x.arrivalLatest);
                });
                const appendedSlots = (appendedTrucks.length * appendedTrucks.length + appendedTrucks.length) / 2;
                const waitingTimeForAppendedSlot = appendedSlots/appendedTrucks.length * CFG.TIMESLOT_LEN;
                const waitingTimeToEnd = Math.max(((CFG.TIME_OFFSET + CFG.QUANT_TIMESLOTS * CFG.TIMESLOT_LEN) - this.arrivalReal),0)
                this.waitingTime = waitingTimeToEnd + waitingTimeForAppendedSlot;
            }
        }

    }

    private calculatePredictedArrival(){
        const t = this.scene.time;
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
        this.calculatePredictedArrival();
        let predictedLaterThanLatest = (this.arrivalPredicted > this.arrivalLatest);
        let timeAfterLatest = (this.scene.time > this.arrivalLatest );
        this.lateReal = (this.arrivalReal > this.arrivalLatest);
        if(!this.latePredicted){
            if (predictedLaterThanLatest || (timeAfterLatest && this.lateReal)){
                this.latePredicted = true;
            }
        }
        if(this.latePredicted){
            if(!predictedLaterThanLatest && !(timeAfterLatest && this.lateReal)){
                this.latePredicted = false;
            }
        }
        if(this.scene.time >= this.arrivalReal){
            this.arrived = true;
        }
        if(!this.latePredicted && this.arrived){
            this.dispatched = true;
        }
    }

    private getDetail(){
        let content = "<p>";
        content += span("id","Truck #",this.id);
        content += span("start", "Start",this.start);
        content += span("way","Wegstrecke",this.totalWay);
        content += span("planned", "Ankunft geplant", this.arrivalPlanned);
        content += span("real", "Ankunft Ist", this.arrivalReal);
        content += span("latest", "Ankunft spätestens", this.arrivalLatest);
        content += span("predicted", "Ankunft voraussichtlich",this.arrivalPredicted);
        content += span("delay","Verspätung",this.delay);
        content += span("waiting","Wartezeit",this.waitingTime);
        content += span("late","Known Late",this.latePredicted);
        content += span("late","Late",(this.arrivalReal > this.arrivalLatest));
        content += "</p>";
        return content;
    }

    private select(){
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

    public setPaper(paper){
        this.paper = paper;
        this.arrow = new Arrow(this.paper);
    }

    private determineColor(){
        this.color = CFG.COLORS.GREEN;
        if(this.lateReal) this.color = CFG.COLORS.RED;
        if(this.latePredicted) this.color = CFG.COLORS.ORANGE;
        
    }

    private calculateYPosition(){
        let y;
        if (!CFG.INDIVIDUAL_ROWS){
            let i = this.row;
            y = (CFG.TIMESLOT_LEN * 3 + 20 * i);
        }
        else{
            let i = this.id;
            y = (CFG.TIMESLOT_LEN * 3 + 15 * i);
        }
        return y;
    }

    public draw(){
            let arrow = this.arrow;
            let x1 = this.arrivalReal;
            let x2 = this.slot.from;
            let y = this.calculateYPosition();
            if (x1 > x2 && x1 < this.arrivalLatest) x2 = this.arrivalReal;
            if(Math.abs(x1-x2) < 8){
                x1 -= 8;
            }
            this.determineColor();  
            if(arrow.color === null || this.color !== arrow.color) arrow.setColor(this.color)
            if(arrow.from === null || x1 !== arrow.from.x || y !== arrow.from.y || x2 !== arrow.to.x){
                arrow.setFrom({x: x1, y});
                arrow.setTo({x: x2, y});
            }
            if(arrow.width !== 5) arrow.setWidth(5);
            this.arrow = arrow;
    }
}


function span(cl: String, content: String, value: any): String{
    return "<span class='"+cl+"'>"+content+": "+String(value)+"</span>";
}