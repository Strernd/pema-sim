import {Truck} from './Truck';
import {Timeslot} from './Timeslot';
import {CFG} from './CFG';
import Prob = require('prob.js');
import Random = require('random-js');
const source = (Random.engines.mt19937().seed(CFG.SEED));



export class Scenario{
    public trucks : Array<Truck>;
    public timeslots : Array<Timeslot>;
    public time: number;

    constructor(){
        this.time = 0;
        this.setupTimeslots();
        this.setupTrucks();
        this.trucksBookSlots();

    }

    public advance(){
        this.time++;
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
            let truck = new Truck(i+1,r)
            this.trucks.push(truck);
        }
    }

    private setupTimeslots(){
        this.timeslots = [];
        for (let i = 0; i < CFG.QUANT_TRUCKS; i++){
            let timeslot = new Timeslot(CFG.TIME_OFFSET+i*CFG.TIMESLOT_LEN,CFG.TIME_OFFSET + (i+1)*CFG.TIMESLOT_LEN);
            this.timeslots.push(timeslot);
        }
    }


}