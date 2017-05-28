import {Truck} from './Truck';

export class Timeslot{
    free: boolean;
    from: number;
    to: number;
    truck: Truck​​;

    constructor(from: number, to: number){
        this.from = from;
        this.to = to;
        this.free = true;
    }

    public assign(truck: Truck){
        this.truck = truck;
        this.free = false;
    }
}