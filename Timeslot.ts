import {Truck} from './Truck';
import { Block } from './Block';

export class Timeslot{
    block: Block;
    free: boolean;
    from: number;
    to: number;
    truck: Truck;

    constructor(from: number, to: number){
        this.from = from;
        this.to = to;
        this.free = true;
    }

    public assign(truck: Truck){
        this.truck = truck;
        this.free = false;
    }

    public setBlock(block){
        this.block = block;
    }
}