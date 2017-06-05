import {Truck} from './Truck';
import {Timeslot} from './Timeslot';
import {CFG} from './CFG';
import Prob = require('prob.js');
import Random = require('random-js');
import * as $ from 'jquery';



export class Scenario{
    paper: any;
    seed : string;

    changed: boolean;
    source : any;
    arrowDistributionRows : Array<Array<Number>>;
    trucks : Array<Truck>;
    timeslots : Array<Timeslot>;
    time: number;
    selected: Truck;
    eventLog;
    KPIs;
    savedTime;

    constructor(paper, seed){
        this.paper = paper;
        this.seed = seed;
        this.source = (Random.engines.mt19937().seed(this.seed));

        this.changed = false;
        this.arrowDistributionRows = [[]];
        this.time = 0;
        this.selected = null;
        this.eventLog = [];
        this.savedTime = 0;
        this.KPIs = {};
        this.setupTimeslots();
        this.setupTrucks();
        this.trucksBookSlots();
        this.trucks.forEach(t => t.calculateProperties());
        this.appendEmptyTimeSlots();
        this.determineTrucksRow();
        this.draw();
    }

    public log(event, truck, from, to){
        let content = '';
        content += '<div class="row">';
        content += '<span class="'+event+'">'+event+'</span>';
        content += '<span class="time">'+this.time+'</span>';
        content += '<span class="truck">Truck #'+truck+'</span>';
        content += '<span class="timeslot timeslot-old">'+from.from+'-'+from.to+'</span>';
        content += '<span class="timeslot timeslot-new">'+to.from+'-'+to.to+'</span>';
        content += '</div>';
        this.eventLog.push([event,truck,from,to]);
        if(CFG.DRAWING) $('#log').prepend(content);
    }

    public draw(){
        if(this.time == 0 || this.changed){
            this.drawTrucks();
            this.drawBlocks();
            this.changed = true;
        }

    }

    public drawBlocks(){
        if(CFG.DRAWING){
            this.timeslots.forEach(ts => ts.updateBlock());
        }
    }

    public drawTrucks(){
        if(CFG.DRAWING){
            this.determineTrucksRow();
            this.trucks.forEach(t => {
                t.draw();
            });
        }
     
    }

    public determineTrucksRow(){
        this.arrowDistributionRows = [[]];
        let trucks = this.trucks;
        trucks.sort((a,b) => a.id - b.id);
        trucks.sort((a,b) => {
            return Math.min(a.arrivalReal, a.slot.from) - Math.min(b.arrivalReal,b.slot.from);
        });
        trucks.forEach(t => {
            t.row = this.fitTruckArrowInRows(t.arrivalReal,t.slot.from);
        });        
    }

    public fitTruckArrowInRows(x1,x2){
        const max = Math.max(x1,x2);
        const min = Math.min(x1,x2);
        const space = 5;
        for (let i = 0; i< this.arrowDistributionRows.length; i++){
            let row = this.arrowDistributionRows[i];
            if(row.length > 0){
                let last = row[row.length - 1]
                if(Number(last) + space < min ){
                    row.push(max);
                    this.arrowDistributionRows[i] = row;
                    return i;
                }
            }
            else{
                row.push(max);
                this.arrowDistributionRows[i] = row;
                return i;
            }
        }
        this.arrowDistributionRows.push([max]);
        return this.arrowDistributionRows.length - 1;
}

    private calculateKPIs(){
        this.KPIs.missedSlots = this.trucks.reduce((a,x) => {
            if(x.arrivalReal > x.arrivalLatest) a++;
            return a;
        },0);
        this.KPIs.unusedSlots = this.timeslots.length - this.trucks.length;
        this.KPIs.truckerWaitingTime = Math.round(this.trucks.reduce((a,x) => {
            a += x.waitingTime;
            return a;
        },0) / this.trucks.length);
        let initiallyInTimeTrucks = this.trucks.filter(x => !x.initiallyLate);
        this.KPIs.earlyTruckerWaitingTime = Math.round(initiallyInTimeTrucks
        .reduce((a,x) => {
            a += x.waitingTime;
            return a;
        },0) / initiallyInTimeTrucks.length);
        this.KPIs.pushMoves = this.eventLog.map(x => x[0]).filter(x => (x === "push")).length;
        this.KPIs.pullMoves = this.eventLog.map(x => x[0]).filter(x => (x === "pull")).length;
        this.KPIs.swapMoves = this.eventLog.map(x => x[0]).filter(x => (x === "swap")).length / 2;
        this.KPIs.totalReschedulings = this.KPIs.pushMoves + this.KPIs.pullMoves + this.KPIs.swapMoves;
        this.KPIs.savedTime = this.savedTime;
        // Trucks that have been moved to the end
        const trucksMovedToEnd = this.trucks.filter(x => x.initiallyLate);
        const totalWaiting = trucksMovedToEnd.reduce((a,x) => { 
            a += x.waitingTime;
            return a;
        },0);
        this.KPIs.truckerWaitingTimeIfMissed = Math.round(totalWaiting / trucksMovedToEnd.length);

        
    }

    private displayKPIs(){
        let content = "";
        for(let kpi in this.KPIs){
            let value = this.KPIs[kpi];
            content += '<p>'+kpi+': '+value+'</p>';
        }
        $('#kpis').html(content);
    }

    public advance(){
        this.time++;

        this.trucks.forEach(t => {
            t.calculateProperties();
        });
        
        if(CFG.ENABLE_SWAP) this.swap();
        if(CFG.ENABLE_PUSH) this.push();
        if(CFG.ENABLE_PULL) this.pull();
        
        this.calculateKPIs();
        if(CFG.DRAWING) this.displayKPIs();
        this.draw();
        
        if(CFG.DRAWING){
         $('#timer').html(String(this.time));
        }
        
    }

    public push(){
        const trucks = this.trucks.filter(t => t.latePredicted);
        trucks.forEach(truck => {
            let slots = this.timeslots.filter(s => {
                return (s.from > truck.arrivalPredicted && s.truck === null);
            });
            if(slots.length > 0){
                let slot = slots[0];
                this.log("push",truck.id,truck.slot,slot);
                truck.slot.unassign();
                truck.assign(slot);
                slot.assign(truck);
            }
        })
    }

    public pull(){
        let trucks = this.trucks.filter(t => {
            return (t.arrivalReal <= this.time);
        });
        trucks.forEach(truck => {
            let slots = this.timeslots.filter(s => {
                let unassigned = (s.truck === null);
                let earlier = (s.from < truck.slot.from)
                let future = (s.latest >= this.time)
                let truckArrived = (truck.arrivalPredicted <= s.latest)
                return (unassigned && earlier && future && truckArrived);
            });
            if(slots.length > 0){
                let slot = slots[0];
                this.log("pull",truck.id,truck.slot,slot);
                this.savedTime += truck.slot.from - slot.from;
                truck.slot.unassign();
                truck.assign(slot);
                slot.assign(truck);
            }
        });
    }

    public swap(){
        let slots = this.getSlotsWillBeMissedAfterNow();
        slots.forEach(slot => {
            let trucks = this.getExchangeTrucksForSlot(slot);
            if (trucks.length > 0 ){
                this.changed = true;
                let truck = trucks[0];
                let tempSlot = truck.slot;
                let tempTruck = slot.truck;
                this.log("swap",truck.id,truck.slot,slot);
                this.log("swap",slot.truck.id,slot,truck.slot);
                this.savedTime += Math.abs(slot.from - truck.slot.from);
                truck.assign(slot);
                slot.assign(truck);
                tempTruck.assign(tempSlot);
                tempSlot.assign(tempTruck);
            }
        });
    }



    private getExchangeTrucksForSlot(slot){
        return this.trucks.filter(truck => {
            let truckArrived = (truck.arrivalPredicted < slot.from);
            let slotEarlier = (truck.slot.from > slot.from);
            return truckArrived && ( slotEarlier || truck.latePredicted );
        })

    }

    private getSlotsWillBeMissedAfterNow(){
        return this.timeslots.filter(s => {
            if(s.truck === null) return false;
            return (s.truck.arrivalPredicted >= this.time && s.truck.latePredicted)
        });
    }


    private getNearestFreeTimeslot(at: number){
        const timeslots = this.timeslots.filter(x => x.free);
        const times = timeslots.map(x => Math.abs(x.from - at));
        times.sort();
        //...
    }

    private getFreeTimeslot(){
        const timeslots = this.timeslots.filter(x => x.free);
        const r = Math.round(Prob.uniform(0,timeslots.length-1)(this.source));
        return timeslots[r];
    }

    private trucksBookSlots(){
        this.trucks.forEach(truck => {
            let slot = this.getFreeTimeslot();
            truck.assign(slot);
            slot.assign(truck);
        });
    }


    private setupTrucks(){
        const fr = Prob.normal(CFG.TRUCKS_TOTAL_WAY_MU, CFG.TRUCKS_TOTAL_WAY_SIGMA);
        this.trucks = [];
        for (let i = 0; i < CFG.QUANT_TRUCKS; i++){
            let r = fr(this.source);
            if(r < 0) r = 0;
            r += CFG.TRUCKS_TOTAL_WAY_MIN;
            let truck = new Truck(this,i+1,r)
            truck.setPaper(this.paper);
            this.trucks.push(truck);
        }
    }

    private appendEmptyTimeSlots(){
        for (let i = this.timeslots.length; i < CFG.QUANT_TIMESLOTS + CFG.APPEND_EMPTY_TIMESLOTS; i++){
            let timeslot = new Timeslot(CFG.TIME_OFFSET+i*CFG.TIMESLOT_LEN,CFG.TIME_OFFSET + (i+1)*CFG.TIMESLOT_LEN);
            timeslot.setPaper(this.paper);
            this.timeslots.push(timeslot);
        }
    }

    private setupTimeslots(){
        this.timeslots = [];
        for (let i = 0; i < CFG.QUANT_TIMESLOTS; i++){
            let timeslot = new Timeslot(CFG.TIME_OFFSET+i*CFG.TIMESLOT_LEN,CFG.TIME_OFFSET + (i+1)*CFG.TIMESLOT_LEN);
            timeslot.setPaper(this.paper);
            this.timeslots.push(timeslot);
        }
    }

    public play(){
        const arr = this.trucks.map(t => t.arrivalReal);
        const max = Math.max(...arr);
        while(this.time < max){
            this.advance();
        }
    }


}