export class CFG{
    static TRUCK_DELAY_LAMBDA = 1.5;
    static DELAY_FACTOR = 0.01 * 15;
    static LATE_EARLY_DIST = 0.5; // 0.3 => 30% early 70% late
    static RUNS = 1;
    static QUANT_TRUCKS = 30;
    static TIMESLOT_LEN = 30;
    static TRUCKS_TOTAL_WAY_MU = 500;
    static TRUCKS_TOTAL_WAY_SIGMA = 250;
    static TRUCKS_TOTAL_WAY_MIN = 100;
    static ADOPTION_RATE = 1;
    static TRUCK_SAFETY_START_TIME_MIN = 5;
    static TRUCK_SAFETY_START_TIME_MAX = 15;
    static TRUCK_DISPATCH_TIME = 20;
    static TIME_OFFSET = 200;
    static SEED = 2;

    private constructor(){

    }
}