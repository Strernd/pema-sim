import * as Raphael from 'raphael';
import { Point } from './objects';
import { CFG } from './CFG';

export class Block{
    element: RaphaelElement;
    corner: Point;
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
    width: number;
    height: number;

    constructor(paper: RaphaelPaper, corner: Point, width, height){
        this.element = paper.rect(corner.x * CFG.SCALE, corner.y * CFG.SCALE, width * CFG.SCALE, height * CFG.SCALE);
        this.corner = corner;
        this.fillColor = null;
        this.strokeColor = null;
        this.width = width;
        this.height = height;
        this.strokeWidth = 1;
    }

    private redraw(){
        this.element.attr("stroke-width",this.strokeWidth);
        this.element.attr("stroke",this.strokeColor);
        this.element.attr("fill", this.fillColor);
        
    }

 

    public setColor(fill: string, stroke: string){
        this.fillColor = fill;
        this.strokeColor = stroke;
        this.redraw();
    }

    public setStrokeWidth(width: number){
        this.strokeWidth = width;
        this.redraw();
    }

}