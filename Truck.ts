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

    constructor(scene: Scenario, id: number, totalWay: number){
        this.force = true;
        this.slot = null;
        this.scene = scene;
        this.source = scene.source;
        this.id = id;
        let x = Prob.uniform(0,1)(this.source);
        this.adoptsRealtime = false;
        if (x <= CFG.ADOPTION_RATE) this.adoptsRealtime = true;
        this.totalWay = Math.round(totalWay);
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
        fr = Prob.uniform(0,CFG.QUANT_TRUCKS*CFG.TIMESLOT_LEN);
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
        // this.slot.block.element.click(() => {
        //     this.select();
        // });
    }


    public assign(slot: Timeslot){
        if(this.slot == null){
            this.slot = slot;
            const safetytime = Prob.uniform(CFG.TRUCK_SAFETY_START_TIME_MIN,CFG.TRUCK_SAFETY_START_TIME_MAX)(this.source);
            this.arrivalPlanned = Math.round(this.slot.from - safetytime);
            this.start =  Math.round(this.arrivalPlanned - this.totalWay);
            this.arrivalReal = Math.round(this.start + this.totalWay + this.delay);
            this.latestArrivalForDispatch = Math.round(this.slot.to - CFG.TRUCK_DISPATCH_TIME);
            this.setEvents();
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
            // console.log("Truck "+this.id+ " will be late");
            this.late = true;
            this.slot.willBeMissed = true;
        }
        if(this.late && (this.arrivalPredicted <= this.latestArrivalForDispatch)){
            this.late = false;
            this.slot.willBeMissed = false;
            // console.log("Truck "+this.id+ " will not be late any more");
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
                y = CFG.TIMESLOT_LEN * 3 + 20 * i;
            }
            else{
                let i = this.id;
                y = CFG.TIMESLOT_LEN * 3 + 10 * i;
            }
            let late = (x1 > this.latestArrivalForDispatch);
            if (late) this.color = CFG.COLORS.RED;
            if (this.late) this.color = CFG.COLORS.ORANGE;
            if (x1 > x2 && x1 < this.latestArrivalForDispatch) x2 = this.latestArrivalForDispatch;
            if(Math.abs(x1-x2) < 5){
                x1 -= 5;
            }
            if(this.color !== arrow.color || this.force) arrow.setColor(this.color)
            if(this.force || x1 !== arrow.from.x || y !== arrow.from.y || x2 !== arrow.to.x){
                arrow.setFrom({x: x1, y});
                arrow.setTo({x: x2, y});
            }
            if(arrow.width !== 3 || this.force) arrow.setWidth(3);
            this.arrow = arrow;
            this.force = false;

    }
}

function span(cl: String, content: String, value: any): String{
    return "<span class='"+cl+"'>"+content+": "+String(value)+"</span>";
}