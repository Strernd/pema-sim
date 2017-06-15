export class CFG{
    static DRAWING = true;

    static RUNS = 1000; // Number of iterations
    static QUANT_TIMESLOTS = 25; // Number of timeslots
    static QUANT_TRUCKS = 23; // Number of trucks
    static DELAY_FACTOR = 0.01 * 15; // Multiplier for the delay (multiplied with total distance)
    static ADOPTION_RATE = 1; 
    static ENABLE_SWAP = true;
    static ENABLE_PULL = true;
    static ENABLE_PUSH = true;
    static TRUCK_DELAY_EXPT = true; // True is exp. dist. - false is norm. dist.
    static TRUCK_DELAY_MU = 0;
    static TRUCK_DELAY_SIGMA = 15;
    static TRUCK_DELAY_LAMBDA = 1;
    static LATE_EARLY_DIST = 0.5; // distribution of late and early delays for exp. dist. 0.3 => 30% early 70% late
    static TIMESLOT_LEN = 50; // length of timeslots
    static TRUCKS_TOTAL_WAY_MU = 500; // mu parameter for norm. dist. of trucks total way
    static TRUCKS_TOTAL_WAY_SIGMA = 250; // sigma parameter for norm. dist. of trucks total way
    static TRUCKS_TOTAL_WAY_MIN = 100; // min way a truck has to have
    static TRUCK_SAFETY_START_TIME_MIN = 5; // min safety time
    static TRUCK_SAFETY_START_TIME_MAX = 15; // max safety time
    static TRUCK_DISPATCH_TIME = 40; // dispatch time for a truck
    
    static TIME_OFFSET = 200;

    static SEED = 7;
    static INDIVIDUAL_ROWS = false;
    static SCALE = 0.8;
    static APPEND_EMPTY_TIMESLOTS = 0;
    

    static COLORS = {
    GREY: "#9E9E9E",
    LIGHTGREY: "#B0BEC5",
    GREEN: "#4CAF50",
    BLUE: "#2196F3",
    RED: "#f44336",
    YELLOW: "#FFEB3B",
    ORANGE: "#FF9800",
    WHITE: "#FFFFFF",
    BLACK: "#212121"
}


    private constructor(){

    }
}