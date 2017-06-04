export class CFG{
    static TRUCK_DELAY_LAMBDA = 1;
    static DELAY_FACTOR = 0.01 * 15;
    static LATE_EARLY_DIST = 0.7; // 0.3 => 30% early 70% late
    static RUNS = 1;
    static QUANT_TIMESLOTS = 30;
    static QUANT_TRUCKS = 20;
    static TIMESLOT_LEN = 50;
    static TRUCKS_TOTAL_WAY_MU = 500;
    static TRUCKS_TOTAL_WAY_SIGMA = 250;
    static TRUCKS_TOTAL_WAY_MIN = 100;
    static ADOPTION_RATE = 0;
    static TRUCK_SAFETY_START_TIME_MIN = 5;
    static TRUCK_SAFETY_START_TIME_MAX = 10;
    static TRUCK_DISPATCH_TIME = 40;
    static TIME_OFFSET = 200;
    static SEED = 6;
    static DRAWING = true;
    static INDIVIDUAL_ROWS = true;
    static SCALE = 0.8;
    static ENABLE_SWAP = true;
    static ENABLE_PULL = true;
    static ENABLE_PUSH = true;
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