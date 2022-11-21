import { List } from 'immutable'

import { tf, data, Task, Logger, Client, GraphInformant, Memory, ModelSource } from '..'

export class Validator {
  private readonly graphInformant = new GraphInformant()
  private size = 0
  private hits = 0
  private classes = 1
  private preds = List<number>()
  private labels = List<number>()
  private _confusionMatrix: number[][] | undefined

  constructor (
    public readonly task: Task,
    public readonly logger: Logger,
    private readonly memory: Memory,
    private readonly source?: ModelSource,
    private readonly client?: Client
  ) {
    if (source === undefined && client === undefined) {
      throw new Error('cannot identify model')
    }
  }

  async assess (data: data.Data, useConfusionMatrix?: boolean): Promise<void> {
    const batchSize = this.task.trainingInformation?.batchSize
    if (batchSize === undefined) {
      throw new TypeError('batch size is undefined')
    }

    const model = await this.getModel()

    this.hits = 0
    this.preds = List()
    this.labels = List()
    this.classes = this.task.trainingInformation.LABEL_LIST?.length ?? 1

    await data.dataset.batch(batchSize).forEachAsync((e) => {
      if (typeof e === 'object' && 'xs' in e && 'ys' in e) {
        const xs = e.xs as tf.Tensor
        const ys = e.ys as tf.Tensor

        const oneHotPreds = (model.predict(xs, { batchSize: batchSize }) as tf.Tensor)

        this.size += xs.shape[0]

        // Get labels from one hot encoding
        const preds = List(oneHotPreds.reshape([-1, this.classes]).argMax(1).arraySync() as number[])
        const labels = List(ys.reshape([-1, this.classes]).argMax(1).arraySync() as number[])

        // Keep track of prediction results for the confusion matrix
        if (useConfusionMatrix) {
          this.preds = this.preds.push(...preds)
          this.labels = this.labels.push(...labels)
        }

        this.hits += preds.zip(labels)
          .map(([p, l]) => p === l ? 1 : 0).reduce((acc: number, e) => acc + e)

        const currentAccuracy = this.hits / this.size
        this.graphInformant.updateAccuracy(currentAccuracy)
      } else {
        throw new Error('missing feature/label in dataset')
      }
    })

    if (useConfusionMatrix) {
      try {
        this._confusionMatrix = tf.math.confusionMatrix(
          this.labels.toArray(),
          this.preds.toArray(),
          this.classes
        ).arraySync()
      } catch (e: any) {
        console.error(e instanceof Error ? e.message : e.toString())
        throw new Error('Failed to compute the confusion matrix')
      }
    }

    this.logger.success(`Obtained validation accuracy of ${this.accuracy}`)
    this.logger.success(`Visited ${this.visitedSamples} samples`)
  }

  async getModel (): Promise<tf.LayersModel> {
    if (this.source !== undefined && await this.memory.contains(this.source)) {
      return await this.memory.getModel(this.source)
    }

    if (this.client !== undefined) {
      return await this.client.getLatestModel()
    }

    throw new Error('cannot identify model')
  }

  get accuracyData (): List<number> {
    return this.graphInformant.data()
  }

  get accuracy (): number {
    return this.graphInformant.accuracy()
  }

  get visitedSamples (): number {
    return this.size
  }

  get confusionMatrix (): number[][] | undefined {
    return this._confusionMatrix
  }
}
