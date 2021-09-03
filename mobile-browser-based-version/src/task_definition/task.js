import * as tf from '@tensorflow/tfjs';

export class Task {
  constructor(taskId, displayInformation, trainingInformation) {
    this.taskId = taskId;
    this.displayInformation = displayInformation;
    this.trainingInformation = trainingInformation;
  }

  async createModel() {
    let newModel = await tf.loadLayersModel(
      'https://deai-313515.ew.r.appspot.com/tasks/' +
        this.taskId +
        '/model.json'
    );
    const savePathDb = 'indexeddb://working_'.concat(
      this.trainingInformation.modelId
    );

    // only keep this here
    await newModel.save(savePathDb);
  }

  async getModelFromStorage() {
    let savePath = 'indexeddb://saved_'.concat(
      this.trainingInformation.modelId
    );
    let model = await tf.loadLayersModel(savePath);
    return model;
  }
}