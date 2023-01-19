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
    constructor() {
        this.width = Math.min(window.innerWidth, window.innerHeight) * 2 / 3;
        this.widthInPixels = 28 * 3;
        this.pixelWidth = this.width / this.widthInPixels;
        this.data = Array(this.widthInPixels ** 2).fill(0);
        this.prevPosX = -1;
        this.prevPosY = -1;
        this.prevPosTimestamp = Date.now();
        this.brushRadius = this.pixelWidth * 3;

        this.clearButton;
        this.initUI();
    }

    getIndexes(ind: number): [number, number] {
        const i = Math.floor(ind / this.widthInPixels);
        const j = ind - i * this.widthInPixels;
        return [i, j];
    }

    getIndex(i: number, j: number): number {
        return i * this.widthInPixels + j;
    }

    updatePixels(x: number, y: number, startX: number, startY: number): void {
        for (let ind = 0; ind < this.data.length; ++ind) {
            const [i, j] = this.getIndexes(ind);
            const pixelCenterX = startX + j * this.pixelWidth - this.pixelWidth / 2;
            const pixelCenterY = startY + i * this.pixelWidth - this.pixelWidth / 2;
            const distToMouse = sketch.dist(x, y, pixelCenterX, pixelCenterY);
            if (distToMouse > this.brushRadius) continue;
            this.data[ind] += sketch.map(distToMouse, 0, this.brushRadius, 1, 0);
            if (this.data[ind] > 1.0) this.data[ind] = 1.0;
        }
    }

    trackDrawing() {
        if (!sketch.mouseIsPressed) return;
        const startX = (window.innerWidth - this.width) / 2;
        const startY = (window.innerHeight - this.width) / 3;
        if (
            sketch.mouseX < startX || 
            sketch.mouseY < startY ||
            sketch.mouseX > startX + this.width ||
            sketch.mouseY > startY + this.width
        ) return;

        const timeDiff = Date.now() - this.prevPosTimestamp;
        const posDiff = sketch.dist(sketch.mouseX, sketch.mouseY, this.prevPosX, this.prevPosY);

        if (timeDiff < 100 && posDiff > this.brushRadius) {
            const maxDist = Math.max(
                Math.abs(sketch.mouseX - this.prevPosX),
                Math.abs(sketch.mouseY - this.prevPosY),
            );
            const steps = Math.ceil(maxDist / this.brushRadius * 1.3);
            const xStep = (sketch.mouseX - this.prevPosX) / steps;
            const yStep = (sketch.mouseY - this.prevPosY) / steps;
            for (let stepInd = 1; stepInd <= steps; stepInd++) {
                this.updatePixels(
                    this.prevPosX + xStep * stepInd, 
                    this.prevPosY + yStep * stepInd, 
                    startX, 
                    startY
                );
            }
        }

        this.updatePixels(sketch.mouseX, sketch.mouseY, startX, startY);
        this.prevPosTimestamp = Date.now();
        this.prevPosX = sketch.mouseX;
        this.prevPosY = sketch.mouseY;
    }

    clear() {
        this.data.fill(0);
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
        this.render();
    }

    render() {
        sketch.noFill();
        sketch.stroke("#fff");
        sketch.strokeWeight(3);

        const startX = (window.innerWidth - this.width) / 2;
        const startY = (window.innerHeight - this.width) / 3;
        sketch.square(startX, startY, this.width);

        sketch.noStroke();
        for (let ind = 0; ind < this.data.length; ++ind) {
            sketch.fill(this.data[ind] * 255);
            const [i, j] = this.getIndexes(ind);
            sketch.square(
                startX + j * this.pixelWidth,
                startY + i * this.pixelWidth,
                this.pixelWidth,
            );
        }
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
