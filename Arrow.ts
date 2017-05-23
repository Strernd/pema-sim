import * as Raphael from 'raphael';
import { Point } from './objects';

export class Arrow{
    element: RaphaelElement;
    from: Point;
    to: Point;
    color: string;
    width: number;
    pathstring: string;

    constructor(paper: RaphaelPaper){
        this.element = paper.path();
        this.from = null;
        this.to = null;
        this.color = null;
        this.width = 1;
        this.pathstring = null;
    }

    private redraw(){
        this.setPathString();
        if(this.pathstring !== null){
            this.element.attr("path",this.pathstring);
            this.element.attr("stroke",this.color);
            this.element.attr("arrow-end", "block-midium-midium");
            this.element.attr("stroke-width", this.width);
        }
    }

    private setPathString(){
        if(this.from !== null && this.to !== null){
            this.pathstring = "M"+this.from.x+","+this.from.y+"L"+this.to.x+","+this.to.y;
        }
        else{
            this.pathstring = null;
        }
    }

    public setFrom(p: Point){
        this.from = p;
        this.redraw();
    }

    public setTo(p: Point){
        this.to = p;
        this.redraw();
    }

    public setColor(color: string){
        this.color = color;
        this.redraw();
    }

    public setWidth(width: number){
        this.width = width;
        this.redraw();
    }

    public move(p: Point){
        if(this.from !== null && this.to !== null){
            this.from = {x: this.from.x + p.x, y: this.from.y + p.y};
            this.to = {x: this.to.x + p.x, y: this.to.y + p.y};
            this.redraw();
        }
    }

    public setLength(length: number){
        if(this.from !== null){
            this.to = {x: this.from.x + length, y: this.from.y};
            this.redraw();
        }
    }

}