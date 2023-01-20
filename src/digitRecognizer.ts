import { loadLayersModel, tensor2d } from '@tensorflow/tfjs';


export class DigitRecognizer {
    model: { predict: (arg0: any) => {
        [x: string]: any; (): any; new(): any; argMax: { (arg0: number): any; new(): any; }; 
}; } | null;
    loading: boolean;
    constructor() {
        this.model = null;
        this.loading = true;
        this.loadModel();
    }

    async loadModel() {
        const modelUrl = (await fetch('/Digit-recognition-CNN/DR-CNN-model.json')).url;
        this.model = await loadLayersModel(modelUrl);
        this.loading = false;
    }

    predict(input: Float32Array): [number, number] | null {
        if (this.loading || !this.model) return null;

        const inputTensor = tensor2d(input, [1, 784]).reshape([1, 28, 28, 1]);
        const prediction = this.model.predict(inputTensor).dataSync();

        let output = 0, confidence = 0;
        for (let i = 0; i < prediction.length; i++) {
            if (prediction[i] >= confidence) {
                confidence = prediction[i];
                output = i;
            }
        }

        return [output, confidence];
    }
}
