import { sketch } from 'p5js-wrapper';
import { DigitRecognizer } from './digitRecognizer';
import { DrawingBoard } from './drawingBoard';
// import { runTraining } from './training.js';


let drawingBoard: DrawingBoard;
let digitRecognizer: DigitRecognizer;
let curNumber: number = 0;
let confidence: number = 0;


sketch.setup = function() {
  // runTraining(50);

  sketch.createCanvas(window.innerWidth, window.innerHeight);
  drawingBoard = new DrawingBoard();
  digitRecognizer = new DigitRecognizer();
  sketch.frameRate(60);
}

sketch.draw = function(){
  drawingBoard.update();
}


sketch.mouseReleased = function() {
  const data = drawingBoard.get28x28data();
  const prediction = digitRecognizer.predict(data);
  if (prediction)
    [curNumber, confidence] = prediction;
  drawPrediction();
}


export function drawPrediction() {
  let message: string;
  if (confidence > 0.7)
    message = "This is " + curNumber + "!\nI'm " + Math.floor(confidence * 100) + "% sure"
  else
    message = "I don't know what this is...";

  sketch.noStroke();
  sketch.fill(sketch.color(18));
  sketch.rect(
    0, 
    (window.innerHeight - drawingBoard.width) / 3 + drawingBoard.width + 10, 
    window.innerWidth, 
    window.innerHeight,
  );

  sketch.fill("#fff");
  sketch.textSize(30);
  sketch.textFont('Helvetica');
  sketch.textAlign(sketch.CENTER, sketch.TOP);
  sketch.text(
    message,
    window.innerWidth / 2, 
    (window.innerHeight - drawingBoard.width) / 3 + drawingBoard.width + 20
  );
}
