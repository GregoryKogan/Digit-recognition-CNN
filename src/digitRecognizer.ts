import { loadLayersModel, tensor2d } from "@tensorflow/tfjs";

export class DigitRecognizer {
  model: {
    predict: (arg0: any) => {
      [x: string]: any;
      (): any;
      new (): any;
      argMax: { (arg0: number): any; new (): any };
    };
  } | null;
  loading: boolean;
  constructor() {
    this.model = null;
    this.loading = true;
    this.loadModel();
  }

  async loadModel() {
    const modelUrl = (await fetch("/digit-recognition-cnn/DR-CNN-model.json"))
      .url;
    this.model = await loadLayersModel(modelUrl);
    this.loading = false;
  }

  predict(input: Float32Array): [number, number] | null {
    if (this.loading || !this.model) return null;

    const inputTensor = tensor2d(input, [1, 784]).reshape([1, 28, 28, 1]);
    const prediction = this.model.predict(inputTensor).dataSync();

    let output = 0;
    let maxActivation = 0;
    for (let i = 0; i < prediction.length; i++) {
      if (prediction[i] >= maxActivation) {
        maxActivation = prediction[i];
        output = i;
      }
    }
    const totalActivation = prediction.reduce(
      (a: number, b: number) => a + b,
      0
    );
    const confidence = maxActivation / totalActivation;
    return [output, confidence];
  }
}
