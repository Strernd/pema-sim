import { Point } from './objects';
import { Arrow } from './Arrow';
import { Block } from './Block';
import { Truck } from './Truck';
import { Scenario } from './Scenario';
import { CFG } from './CFG';
import * as Raphael from 'raphael';


export class Simulation{
    runs: number;
    currentRun;
    paper;
    results;

    constructor(runs){
        this.runs = runs;
        this.currentRun = 0;
        this.results = [];
        this.paper = Raphael("paper", ((CFG.QUANT_TIMESLOTS + CFG.APPEND_EMPTY_TIMESLOTS)* CFG.TIMESLOT_LEN  + 250 ) * CFG.SCALE, 400 * CFG.SCALE + (400 * Number(CFG.INDIVIDUAL_ROWS)));
    }

    private step(){
        this.currentRun++;
        const scene = new Scenario(this.paper,this.currentRun);
        scene.play();
        this.results.push(scene.KPIs);
    }

    public run(){
        while(this.currentRun < this.runs){
            if(this.currentRun % 100 === 0){
                console.log("current Iteration: "+this.currentRun);
            }
            this.step();
        }
        this.evaluate();
    }
    
    private evaluate(){
        const result = {};
        const KPIs = this.results[0];
        for (let kpi in KPIs){
            let avgVal = this.results.reduce((a,x) => {
                a += x[kpi];
                return a;
            },0) / this.results.length;       
            result[kpi] = avgVal;     
        }
        console.log(result);
    }
}