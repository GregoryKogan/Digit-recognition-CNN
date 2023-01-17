import {sketch} from 'p5js-wrapper';


sketch.setup = function() {
  sketch.createCanvas(window.innerWidth, window.innerHeight);
}

sketch.draw = function() {
  sketch.background(18);
  sketch.circle(window.innerWidth / 2, window.innerHeight / 2, 100);
}
