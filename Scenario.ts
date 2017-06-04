import {Truck} from './Truck';
import {Timeslot} from './Timeslot';
import {CFG} from './CFG';
import Prob = require('prob.js');
import Random = require('random-js');
import * as $ from 'jquery';



export class Scenario{
    public changed: boolean;
    public source : any;
    public seed : string;
    public paper: any;
    public arrowDistributionRows : Array<Array<Number>>;
    public trucks : Array<Truck>;
    public timeslots : Array<Timeslot>;
    public time: number;
    public selected: Truck;

    constructor(paper, seed){
        this.changed = false;
        this.seed = seed;
        this.source = (Random.engines.mt19937().seed(this.seed));
        this.paper = paper;
        this.arrowDistributionRows = [[]];
        this.time = 0;
        this.selected = null;
        this.setupTimeslots();
        this.setupTrucks();
        this.trucksBookSlots();
        this.determineTrucksRow();
        this.draw();

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
                t.updateArrow();
            });
        }
     
    }

    public determineTrucksRow(){
        this.arrowDistributionRows = [[]];
        let trucks = this.trucks;
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

    public advance(){
        this.time++;

        this.trucks.forEach(t => {
            t.calculatePredictedArrival(this.time);
            t.determineReallocation(this.time);
            // t.setDomContent();
        });
        this.reallocate();
        this.moveLateTrucksToFreeSlots();
        this.moveEarlyTrucksToFreeSlots();
        
        this.draw();
        // this.trucks.forEach(t => {t.setEvents()});
        
        let trucks = this.trucks.filter(t => t.arrivalReal == this.time);
        if(CFG.DRAWING){
            let unused = this.trucks.reduce((a,x) => {
            if(x.arrivalReal > x.latestArrivalForDispatch){
                a += 1;
            }
            return a;
        },0);
         $('#timer').html(String(this.time)+" "+String(unused));

        }
        
    }

    public reallocate2(){
        let slots = this.getSlotsWillBeMissedAfterNow();
        slots.forEach(s => {
            if(s.truck !== null) s.truck.unassign();
            s.unassign(); 
        });
        let trucks = this.getUnassignedTrucks();
        trucks.forEach(truck => {
            slots = this.getUnassignedSlotsAfterNow();
            slots = slots.filter(slot => {
                return (slot.from > truck.arrivalPredicted);
            })
            if(slots.length > 0){
                let slot = slots[0];
                truck.assign(slot);
                slot.assign(truck);
            }
        });
        this.draw();

    }

    public moveLateTrucksToFreeSlots(){
        let trucks = this.getLateTrucksAfterNow();
        trucks.forEach(truck => {
            let slots = this.timeslots.filter(s => {
                return (s.from > truck.arrivalPredicted && s.truck === null);
            });
            if(slots.length > 0){
                let slot = slots[0];
                truck.slot.unassign();
                truck.assign(slot);
                slot.assign(truck);
            }
        })
    }

    public moveEarlyTrucksToFreeSlots(){
        const cautionTime = 0;
        let trucks = this.trucks.filter(t => {
            return (t.arrivalPredicted + cautionTime < t.slot.from && t.arrivalPredicted > this.time);
        });
        trucks.forEach(truck => {
            let slots = this.timeslots.filter(s => {
                let unassigned = (s.truck === null);
                let earlier = (s.from < truck.slot.from)
                let future = (s.from > this.time)
                let truckArrived = (truck.arrivalPredicted < s.from)
                return (unassigned && earlier && future && truckArrived);
            });
            if(slots.length > 0){
                let slot = slots[0];
                truck.slot.unassign();
                truck.assign(slot);
                slot.assign(truck);
            }
        });
    }

    public reallocate(){
        let slots = this.getSlotsWillBeMissedAfterNow();
        slots.forEach(slot => {
            let trucks = this.getExchangeTrucksForSlot(slot);
            if (trucks.length > 0 ){
                this.changed = true;
                let truck = trucks[0];
                let tempSlot = truck.slot;
                let tempTruck = slot.truck;
                truck.assign(slot);
                slot.assign(truck);
                tempTruck.assign(tempSlot);
                tempSlot.assign(tempTruck);
            }
        });
    }

    private getLateTrucksAfterNow(){
        return this.trucks.filter(t => {
            return (t.late && t.arrivalPredicted > this.time);
        })
    }

    private getUnassignedTrucks(){
        return this.trucks.filter(t => {
            return (t.slot === null);
        })
    }

    private getUnassignedSlotsAfterNow(){
        return this.timeslots.filter(s => {
            return (s.truck === null && s.from > this.time);
        })
    }

    private getExchangeTrucksForSlot(slot){
        return this.trucks.filter(truck => {
            let truckArrived = (truck.arrivalPredicted < slot.from);
            let slotEarlier = (truck.slot.from > slot.from);
            return truckArrived && ( slotEarlier || truck.late );
        })

    }

    private getSlotsWillBeMissedAfterNow(){
        return this.timeslots.filter(s => {
            if(s.truck === null) return false;
            return (s.truck.arrivalPredicted >= this.time && s.truck.late)
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

    private setupTimeslots(){
        this.timeslots = [];
        for (let i = 0; i < CFG.QUANT_TIMESLOTS; i++){
            let timeslot = new Timeslot(CFG.TIME_OFFSET+i*CFG.TIMESLOT_LEN,CFG.TIME_OFFSET + (i+1)*CFG.TIMESLOT_LEN);
            timeslot.setPaper(this.paper);
            this.timeslots.push(timeslot);
        }
    }

    public play(){
        let unused = this.trucks.reduce((a,x) => {
            if(x.arrivalReal > x.latestArrivalForDispatch){
                a += 1;
            }
            return a;
        },0);
        const arr = this.trucks.map(t => t.arrivalReal);
        const max = Math.max(...arr);
        while(this.time < max){
            this.advance();
        }
        unused = this.trucks.reduce((a,x) => {
            if(x.arrivalReal > x.latestArrivalForDispatch){
                a += 1;
            }
            return a;
        },0);
        
    
    }


}