import {Truck} from './Truck';
import {Timeslot} from './Timeslot';
import {CFG} from './CFG';
import Prob = require('prob.js');
import Random = require('random-js');
const source = (Random.engines.mt19937().seed(CFG.SEED));
import * as $ from 'jquery';



export class Scenario{
    public paper: any;
    public arrowDistributionRows : Array<Array<Number>>;
    public trucks : Array<Truck>;
    public timeslots : Array<Timeslot>;
    public time: number;

    constructor(paper){
        this.paper = paper;
        this.arrowDistributionRows = [[]];
        this.time = 0;
        this.setupTimeslots();
        this.setupTrucks();
        this.trucksBookSlots();
        this.determineTrucksRow();
        this.drawTrucks();
        this.drawBlocks();

    }

    public drawBlocks(){
        this.timeslots.forEach(ts => ts.updateBlock());
    }

    public drawTrucks(){
        this.determineTrucksRow();
        this.trucks.forEach(t => {
            t.updateArrow();
        });
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
        let unused = this.trucks.reduce((a,x) => {
            if(x.arrivalReal > x.latestArrivalForDispatch){
                a += 1;
            }
            return a;
        },0);
        this.trucks.forEach(t => {
            t.calculatePredictedArrival(this.time);
            t.determineReallocation(this.time);
            t.setDomContent();
        });
        this.reallocate();
        
        let trucks = this.trucks.filter(t => t.arrivalReal == this.time);
        trucks.forEach(t => console.log("Truck "+t.id+" arrived"));
        $('#timer').html(String(this.time)+" "+String(unused));
        
    }

    public reallocate(){
        let needRedraw = [] as Array<Truck>;
        let futureMissedSlots = this.timeslots.filter(ts => {
            return (ts.willBeMissed && ts.latest >= this.time)
        });
        futureMissedSlots.forEach(slot => {
            let possibleTrucks = this.trucks.filter(truck => {
                let truckArrived = (truck.arrivalPredicted < slot.from)
                let slotEarlier = (truck.slot.from > slot.from);
                return truckArrived && (slotEarlier || truck.late);
            });
            if(possibleTrucks.length > 0){
                // possibleTrucks.sort((a,b) => b.waitingTime - a.waitingTime);
                let chosenTruck = possibleTrucks[0];
                let laterSlot = chosenTruck.slot;
                let oldTruck = slot.truck;
                console.log("reassigned "+slot+ " to "+chosenTruck.id);
                slot.assign(chosenTruck);
                slot.willBeMissed = false;
                chosenTruck.assign(slot);
                laterSlot.assign(oldTruck);
                oldTruck.assign(laterSlot);
            }

        });

        this.drawTrucks();
        this.drawBlocks();
        
    }


    private getNearestFreeTimeslot(at: number){
        const timeslots = this.timeslots.filter(x => x.free);
        const times = timeslots.map(x => Math.abs(x.from - at));
        times.sort();

        // ...
    }

    private getRandomFreeTimeslot(){
        const timeslots = this.timeslots.filter(x => x.free);
        return timeslots[0];
    }

    private trucksBookSlots(){
        this.trucks.forEach(truck => {
            let slot = this.getRandomFreeTimeslot();
            truck.assign(slot);
            slot.assign(truck);
        });
    }


    private setupTrucks(){
        const fr = Prob.normal(CFG.TRUCKS_TOTAL_WAY_MU, CFG.TRUCKS_TOTAL_WAY_SIGMA);
        this.trucks = [];
        for (let i = 0; i < CFG.QUANT_TRUCKS; i++){
            let r = fr(source);
            if(r < 0) r = 0;
            r += CFG.TRUCKS_TOTAL_WAY_MIN;
            let truck = new Truck(this,i+1,r)
            truck.setPaper(this.paper);
            this.trucks.push(truck);
        }
    }

    private setupTimeslots(){
        this.timeslots = [];
        for (let i = 0; i < CFG.QUANT_TRUCKS; i++){
            let timeslot = new Timeslot(CFG.TIME_OFFSET+i*CFG.TIMESLOT_LEN,CFG.TIME_OFFSET + (i+1)*CFG.TIMESLOT_LEN);
            timeslot.setPaper(this.paper);
            this.timeslots.push(timeslot);
        }
    }


}