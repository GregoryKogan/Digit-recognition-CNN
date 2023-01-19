import { sketch } from 'p5js-wrapper';
import { runTraining } from './training.js';


sketch.setup = function() {
  runTraining(100);
  sketch.createCanvas(window.innerWidth, window.innerHeight);
}

sketch.draw = function(){
  sketch.background(18);
  sketch.circle(window.innerWidth / 2, window.innerHeight / 2, 80);
}
