import { DataLoader, DataConfig, Data } from './data_loader'
import { Dataset } from '../dataset_builder'
import { Task } from '../../task'
import * as tf from '@tensorflow/tfjs'
import _ from 'lodash'

export abstract class TabularLoader<Source> extends DataLoader<Source> {
  private readonly delimiter: string

  constructor (task: Task, delimiter: string) {
    super(task)
    this.delimiter = delimiter
  }

  /**
   * Creates a CSV dataset object based off the given source.
   * @param source File object, URL string or local file system path.
   * @param csvConfig Object expected by TF.js to create a CSVDataset.
   * @returns The CSVDataset object built upon the given source.
   */
  abstract loadTabularDatasetFrom (source: Source, csvConfig: Record<string, unknown>): tf.data.CSVDataset

  /**
   * Expects delimiter-separated tabular data made of N columns. The data may be
   * potentially split among several sources. Every source should contain N-1
   * feature columns and 1 single label column.
   * @param source List of File objects, URLs or file system paths.
   * @param config
   * @returns A TF.js dataset built upon read tabular data stored in the given sources.
   */
  async load (source: Source, config?: DataConfig): Promise<Dataset> {
    /**
     * Prepare the CSV config object based off the given features and labels.
     * If labels is empty, then the returned dataset is comprised of samples only.
     * Otherwise, each entry is of the form `{ xs, ys }` with `xs` as features and `ys`
     * as labels.
     */
    if (config === undefined || config.features === undefined) {
      // TODO @s314cy
      throw new Error('not implemented')
    }
    const columnConfigs = {}
    _.forEach(config.features, (feature) => {
      columnConfigs[feature] = { required: false, isLabel: false }
    })
    if (config.labels !== undefined) {
      _.forEach(config.labels, (label) => {
        columnConfigs[label] = { required: true, isLabel: true }
      })
    }

    const csvConfig = {
      hasHeader: true,
      columnConfigs,
      configuredColumnsOnly: true,
      delimiter: this.delimiter
    }
    const dataset = this.loadTabularDatasetFrom(source, csvConfig)
    return (dataset).map((t) => {
      const { xs, ys } = t as Record<string, unknown>
      return {
        xs: Object.values(xs),
        ys: Object.values(ys)
      }
    })
  }

  /**
    * Creates the CSV datasets based off the given sources, then fuses them into a single CSV
    * dataset.
    */
  async loadAll (sources: Source[], config: DataConfig): Promise<Data> {
    const datasets = await Promise.all(_.map(sources, (source) => this.load(source, config)))
    const dataset = _.reduce(datasets, (prev, curr) => prev.concatenate(curr))
    return {
      dataset: dataset,
      size: dataset.size // TODO: needs to be tested
    }
  }
}