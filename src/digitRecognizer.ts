import * as tf from '@tensorflow/tfjs';


export class DigitRecognizer {
    model: null;
    loading: boolean;
    constructor() {
        this.model = null;
        this.loading = true;
        this.loadModel();
    }

    async loadModel() {
        this.model = await tf.loadLayersModel('trained-model/DR-CNN-model.json');
        this.loading = false;
    }
}