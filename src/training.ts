import { visor, show, render, metrics } from '@tensorflow/tfjs-vis';
import { tidy, browser, sequential, layers, train } from '@tensorflow/tfjs';
// @ts-ignore
import { MnistData } from './data.js';


async function showExamples(data: { nextTestBatch: (arg0: number) => any; }) {
  // Create a container in the visor
  const surface =
    visor().surface({ name: 'Input Data Examples', tab: 'Input Data'});  

  // Get the examples
  const examples = data.nextTestBatch(50);
  const numExamples = examples.xs.shape[0];
  
  // Create a canvas element to render each example
  for (let i = 0; i < numExamples; i++) {
    const imageTensor = tidy(() => {
      // Reshape the image to 28x28 px
      return examples.xs
        .slice([i, 0], [1, examples.xs.shape[1]])
        .reshape([28, 28, 1]);
    });
    
    const canvas = document.createElement('canvas');
    canvas.width = 28;
    canvas.height = 28;
    await browser.toPixels(imageTensor, canvas);
    surface.drawArea.appendChild(canvas);

    imageTensor.dispose();
  }
}


function getModel() {
  const model = sequential();
  
  const IMAGE_WIDTH = 28;
  const IMAGE_HEIGHT = 28;
  const IMAGE_CHANNELS = 1;  
  
  // In the first layer of our convolutional neural network we have 
  // to specify the input shape. Then we specify some parameters for 
  // the convolution operation that takes place in this layer.
  model.add(layers.conv2d({
    inputShape: [IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS],
    kernelSize: 5,
    filters: 8,
    strides: 1,
    activation: 'relu',
    kernelInitializer: 'varianceScaling'
  }));

  // The MaxPooling layer acts as a sort of downsampling using max values
  // in a region instead of averaging.  
  model.add(layers.maxPooling2d({poolSize: [2, 2], strides: [2, 2]}));
  
  // Repeat another conv2d + maxPooling stack. 
  // Note that we have more filters in the convolution.
  model.add(layers.conv2d({
    kernelSize: 5,
    filters: 32,
    strides: 1,
    activation: 'relu',
    kernelInitializer: 'varianceScaling'
  }));
  model.add(layers.maxPooling2d({poolSize: [2, 2], strides: [2, 2]}));
  
  // Now we flatten the output from the 2D filters into a 1D vector to prepare
  // it for input into our last layer. This is common practice when feeding
  // higher dimensional data to a final classification output layer.
  model.add(layers.flatten());

  model.add(layers.dense({
    units: 2048,
    kernelInitializer: 'varianceScaling',
    activation: 'relu',
  }));

  // Our last layer is a dense layer which has 10 output units, one for each
  // output class (i.e. 0, 1, 2, 3, 4, 5, 6, 7, 8, 9).
  const NUM_OUTPUT_CLASSES = 10;
  model.add(layers.dense({
    units: NUM_OUTPUT_CLASSES,
    kernelInitializer: 'varianceScaling',
    activation: 'softmax'
  }));

  
  // Choose an optimizer, loss function and accuracy metric,
  // then compile and return the model
  const optimizer = train.adam();
  model.compile({
    optimizer: optimizer,
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });

  return model;
}


async function trainModel(
  model: { fit: (arg0: any, arg1: any, arg2: { batchSize: number; validationData: any[]; epochs: number; shuffle: boolean; callbacks: any; }) => any; }, 
  data: { nextTrainBatch: (arg0: number) => any; nextTestBatch: (arg0: number) => any; },
  epochs: number=10,
) {
  const metrics = ['loss', 'val_loss', 'acc', 'val_acc'];
  const container = {
    name: 'Model Training', tab: 'Model', styles: { height: '1000px' }
  };
  const fitCallbacks = show.fitCallbacks(container, metrics);
  
  const BATCH_SIZE = 512;
  const TRAIN_DATA_SIZE = 5500;
  const TEST_DATA_SIZE = 1000;

  const [trainXs, trainYs] = tidy(() => {
    const d = data.nextTrainBatch(TRAIN_DATA_SIZE);
    return [
      d.xs.reshape([TRAIN_DATA_SIZE, 28, 28, 1]),
      d.labels
    ];
  });

  const [testXs, testYs] = tidy(() => {
    const d = data.nextTestBatch(TEST_DATA_SIZE);
    return [
      d.xs.reshape([TEST_DATA_SIZE, 28, 28, 1]),
      d.labels
    ];
  });

  return model.fit(trainXs, trainYs, {
    batchSize: BATCH_SIZE,
    validationData: [testXs, testYs],
    epochs: epochs,
    shuffle: true,
    callbacks: fitCallbacks
  });
}


const classNames = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];

function doPrediction(
  model: { predict: (arg0: any) => { (): any; new(): any; argMax: { (arg0: number): any; new(): any; }; }; }, 
  data: { nextTestBatch: (arg0: number) => any; }, 
  testDataSize = 500
) {
  const IMAGE_WIDTH = 28;
  const IMAGE_HEIGHT = 28;
  const testData = data.nextTestBatch(testDataSize);
  const testxs = testData.xs.reshape([testDataSize, IMAGE_WIDTH, IMAGE_HEIGHT, 1]);
  const labels = testData.labels.argMax(-1);
  const preds = model.predict(testxs).argMax(-1);

  testxs.dispose();
  return [preds, labels];
}


async function showAccuracy(
  model: { predict: (arg0: any) => { (): any; new(): any; argMax: { (arg0: number): any; new(): any; }; }; }, 
  data: { nextTestBatch: (arg0: number) => any; }
) {
  const [preds, labels] = doPrediction(model, data);
  const classAccuracy = await metrics.perClassAccuracy(labels, preds);
  const container = {name: 'Accuracy', tab: 'Evaluation'};
  show.perClassAccuracy(container, classAccuracy, classNames);

  labels.dispose();
}


async function showConfusion(
  model: { predict: (arg0: any) => { (): any; new(): any; argMax: { (arg0: number): any; new(): any; }; }; }, 
  data: { nextTestBatch: (arg0: number) => any; }
) {
  const [preds, labels] = doPrediction(model, data);
  const confusionMatrix = await metrics.confusionMatrix(labels, preds);
  const container = {name: 'Confusion Matrix', tab: 'Evaluation'};
  render.confusionMatrix(container, {values: confusionMatrix, tickLabels: classNames});

  labels.dispose();
}


export async function runTraining(epochs: number=10) {  
  const data = new MnistData();
  await data.load();
  await showExamples(data);

  const model = getModel();
  show.modelSummary({name: 'Model Architecture', tab: 'Model'}, model);
  
  await trainModel(model, data, epochs);

  await showAccuracy(model, data);
  await showConfusion(model, data);

  await model.save('downloads://DR-CNN-model');
}
