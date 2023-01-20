import { sketch } from 'p5js-wrapper';


export class DrawingBoard {
    width: number;
    widthInPixels: number;
    pixelWidth: number;
    data: number[];
    brushRadius: number;
    prevPosTimestamp: number;
    prevPosX: number;
    prevPosY: number;
    clearButton: any;
    startX: number;
    startY: number;
    constructor() {
        if (window.innerWidth > window.innerHeight)
            this.width = window.innerHeight * 2 / 3;
        else 
            this.width = Math.min(window.innerWidth * 0.9, window.innerHeight - 200);
        this.widthInPixels = 28 * 2;
        this.pixelWidth = this.width / this.widthInPixels;
        this.data = Array(this.widthInPixels ** 2).fill(0);
        this.prevPosX = -1;
        this.prevPosY = -1;
        this.prevPosTimestamp = sketch.millis();
        this.brushRadius = this.pixelWidth * 2.7;

        this.startX = (window.innerWidth - this.width) / 2;
        this.startY = (window.innerHeight - this.width) / 3;

        this.clearButton;
        this.initUI();
        this.fullRender();
    }

    getIndexes(ind: number): [number, number] {
        const i = Math.floor(ind / this.widthInPixels);
        const j = ind - i * this.widthInPixels;
        return [i, j];
    }

    getIndex(i: number, j: number): number {
        return i * this.widthInPixels + j;
    }

    updatePixels(points: {x: number, y: number}[]): void {
        for (const point of points) {
            const nearestI = sketch.constrain(
                Math.round((point.y - this.startY) / this.pixelWidth), 
                0, this.widthInPixels
            );
            const nearestJ = sketch.constrain(
                Math.round((point.x - this.startX) / this.pixelWidth), 
                0, this.widthInPixels
            );

            const offset = Math.ceil(this.brushRadius / this.pixelWidth);
            for (let io = -offset; io <= offset; io++) {
                for (let jo = -offset; jo <= offset; jo++) {
                    const ti = nearestI + io;
                    const tj = nearestJ + jo;
                    if (ti < 0 || ti >= this.widthInPixels || tj < 0 || tj >= this.widthInPixels)
                        continue;
                    const pixelCenterX = this.startX + tj * this.pixelWidth - this.pixelWidth / 2;
                    const pixelCenterY = this.startY + ti * this.pixelWidth - this.pixelWidth / 2;
                    const distToMouse = sketch.dist(point.x, point.y, pixelCenterX, pixelCenterY);
                    if (distToMouse > this.brushRadius) continue;
                    const linearInd = this.getIndex(ti, tj);
                    const oldValue = this.data[linearInd];
                    this.data[linearInd] += sketch.map(distToMouse, 0, this.brushRadius, 1, 0);
                    if (this.data[linearInd] > 1.0) this.data[linearInd] = 1.0;
                    if (this.data[linearInd] != oldValue)
                        this.renderPixel(linearInd);
                }
            }
        }
    }

    trackDrawing() {
        if (!sketch.mouseIsPressed) return;
        if (
            sketch.mouseX < this.startX || 
            sketch.mouseY < this.startY ||
            sketch.mouseX > this.startX + this.width ||
            sketch.mouseY > this.startY + this.width
        ) return;

        const timeDiff = sketch.millis() - this.prevPosTimestamp;
        const posDiff = sketch.dist(sketch.mouseX, sketch.mouseY, this.prevPosX, this.prevPosY);

        let points = [];

        if (timeDiff < 100 && posDiff > this.brushRadius) {
            const maxDist = Math.max(
                Math.abs(sketch.mouseX - this.prevPosX),
                Math.abs(sketch.mouseY - this.prevPosY),
            );
            const steps = Math.ceil(maxDist / this.brushRadius * 2);
            const xStep = (sketch.mouseX - this.prevPosX) / steps;
            const yStep = (sketch.mouseY - this.prevPosY) / steps;
            for (let stepInd = 1; stepInd <= steps; stepInd++) {
                points.push({
                    x: this.prevPosX + xStep * stepInd, 
                    y: this.prevPosY + yStep * stepInd
                });
            }
        }

        points.push({x: sketch.mouseX, y: sketch.mouseY});
        this.updatePixels(points);
        this.prevPosTimestamp = sketch.millis();
        this.prevPosX = sketch.mouseX;
        this.prevPosY = sketch.mouseY;
    }

    clear() {
        this.data.fill(0);
        this.fullRender();
    }

    initUI(){
        this.clearButton = sketch.createButton("Clear");
        this.clearButton.mousePressed(() => this.clear());
        this.clearButton.position(
            (window.innerWidth - 130) / 2, 
            (window.innerHeight - this.width) / 3 - 50,
        );
        this.clearButton.size(130, 35);
        this.clearButton.style('font-size', '20px');
        this.clearButton.style('background-color', '#303030');
        this.clearButton.style('color', 'white');
        this.clearButton.style('font-family', 'Helvetica');
        this.clearButton.style('border-radius', '25px');
    }

    update() {
        this.trackDrawing();
    }

    renderPixel(ind: number) {
        sketch.noStroke();
        sketch.fill(this.data[ind] * 255);
        const [i, j] = this.getIndexes(ind);
            sketch.square(
                this.startX + j * this.pixelWidth,
                this.startY + i * this.pixelWidth,
                this.pixelWidth,
        );
    }

    fullRender() {
        sketch.background(18);

        sketch.noFill();
        sketch.stroke("#fff");
        sketch.strokeWeight(3);

        sketch.square(this.startX, this.startY, this.width);

        for (let ind = 0; ind < this.data.length; ++ind) 
            this.renderPixel(ind);
    }

    get28x28data(): Float32Array {
        const result = new Float32Array(28*28);

        const factor = this.widthInPixels / 28;
        for (let i = 0; i < 28; ++i) {
            for (let j = 0; j < 28; ++j) {
                let maxVal = 0;
                for (let oi = 0; oi < factor; ++oi) {
                    for (let oj = 0; oj < factor; ++oj) {
                        maxVal = Math.max(
                            maxVal, 
                            this.data[this.getIndex(i * factor + oi, j * factor + oj)]
                        );
                    }
                }
                result[i * 28 + j] = maxVal;
            }
        }
        return result;
    }
}
