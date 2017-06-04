import {Truck} from './Truck';
import { Block } from './Block';
import {CFG} from './CFG';

export class Timeslot{
    paper: any;
    block: Block;
    willBeMissed: boolean;
    free: boolean;
    from: number;
    to: number;
    latest: number;
    truck: Truck;

    constructor(from: number, to: number){
        this.willBeMissed = false;
        this.from = from;
        this.to = to;
        this.latest = to - CFG.TRUCK_DISPATCH_TIME;
        this.free = true;
        this.truck = null;
    }

    public assign(truck: Truck){
        this.truck = truck;
        this.free = false;
    }

    public unassign(){
        this.truck = null;
    }

    public setBlock(block){
        this.block = block;
    }

    public setPaper(paper){
        this.paper = paper;
        if(CFG.DRAWING){
            this.block = new Block(paper,{x: this.from, y:0},CFG.TIMESLOT_LEN,CFG.TIMESLOT_LEN*2);
        }
        
    }

    public updateBlock(){
        let block = this.block;
        let color = CFG.COLORS.WHITE;
        if(this.truck !== null) color = this.truck.color
        block.setColor(color,CFG.COLORS.BLACK);
        this.block = block;
    }
}