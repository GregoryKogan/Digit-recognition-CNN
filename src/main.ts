import { sketch } from 'p5js-wrapper';
import { DrawingBoard } from './drawingBoard';
// import { runTraining } from './training.js';


let drawingBoard: DrawingBoard;


sketch.setup = function() {
  sketch.createCanvas(window.innerWidth, window.innerHeight);
  drawingBoard = new DrawingBoard();
}

sketch.draw = function(){
  sketch.background(18);
  drawingBoard.update();
}
