import { Set } from 'immutable'

export class DataExample {
  static isDataExample (raw: unknown): raw is DataExample {
    if (typeof raw !== 'object') {
      return false
    }
    if (raw === null) {
      return false
    }

    if (!Set(Object.keys(raw)).equals(Set.of('columnName', 'columnData'))) {
      return false
    }
    const { columnName, columnData } = raw as Record<'columnName' | 'columnData', unknown>

    if (
      typeof columnName !== 'string' ||
      (typeof columnData !== 'string' && typeof columnData !== 'number')
    ) {
      return false
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = new DataExample(columnName, columnData)

    return true
  }

  constructor (
    public readonly columnName: string,
    public readonly columnData: string | number
  ) {}
}

export class DisplayInformation {
  static isDisplayInformation (raw: unknown): raw is DisplayInformation {
    if (typeof raw !== 'object') {
      return false
    }
    if (raw === null) {
      return false
    }

    const requiredFields = Set.of(
      'dataExampleText',
      'dataFormatInformation',
      'overview',
      'summary',
      'taskTitle',
      'tradeoffs'
    )
    type Fields =
      'dataExample' |
      'dataExampleImage' |
      'dataExampleText' |
      'dataFormatInformation' |
      'headers' |
      'limitations' |
      'model' |
      'overview' |
      'summary' |
      'taskTitle' |
      'tradeoffs'
    if (!requiredFields.isSubset(Object.keys(raw))) {
      return false
    }
    const {
      dataExample,
      dataExampleImage,
      dataExampleText,
      dataFormatInformation,
      headers,
      limitations,
      model,
      overview,
      summary,
      taskTitle,
      tradeoffs
    } = raw as Record<Fields, unknown | undefined>

    if (
      typeof dataExampleText !== 'string' ||
      typeof dataFormatInformation !== 'string' ||
      typeof overview !== 'string' ||
      typeof summary !== 'string' ||
      typeof taskTitle !== 'string' ||
      typeof tradeoffs !== 'string' ||
      (model !== undefined && typeof model !== 'string') ||
      (dataExampleImage !== undefined && typeof dataExampleImage !== 'string') ||
      (limitations !== undefined && typeof limitations !== 'string')
    ) {
      return false
    }
    if (
      dataExample !== undefined && !(
        Array.isArray(dataExample) &&
        dataExample.every(DataExample.isDataExample))
    ) {
      return false
    }
    if (
      headers !== undefined && !(
        Array.isArray(headers) &&
        headers.every((e) => typeof e === 'string'))
    ) {
      return false
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = new DisplayInformation(
      taskTitle,
      summary,
      overview,
      tradeoffs,
      dataFormatInformation,
      dataExampleText,
      model,
      dataExample,
      headers,
      dataExampleImage,
      limitations
    )

    return true
  }

  constructor (
    public readonly taskTitle: string,
    public readonly summary: string,
    public readonly overview: string,
    public readonly tradeoffs: string,
    public readonly dataFormatInformation: string,
    // TODO merge dataExample*
    public readonly dataExampleText: string,
    public readonly model?: string,
    // TODO no need for undefined
    public readonly dataExample?: DataExample[],
    // TODO no need for undefined
    public readonly headers?: string[],
    public readonly dataExampleImage?: string,
    public readonly limitations?: string
  ) {}
}

export class ModelCompileData {
  constructor (
    public readonly optimizer: string,
    public readonly loss: string,
    public readonly metrics: string[]
  ) {}
}

export class TrainingInformation {
  constructor (
    public readonly modelID: string,
    public readonly epochs: number,
    public readonly roundDuration: number,
    public readonly validationSplit: number,
    public readonly batchSize: number,
    public readonly preprocessFunctions: string[],
    public readonly modelCompileData: ModelCompileData,
    public readonly dataType: string,
    public readonly receivedMessagesThreshold?: number,
    public readonly inputColumns?: string[],
    public readonly outputColumns?: string[],
    public readonly threshold?: number,
    public readonly IMAGE_H?: number,
    public readonly IMAGE_W?: number,
    public readonly LABEL_LIST?: string[],
    public readonly aggregateImagesById?: boolean,
    public readonly learningRate?: number,
    public readonly NUM_CLASSES?: number,
    public readonly csvLabels?: boolean,
    public readonly RESIZED_IMAGE_H?: number,
    public readonly RESIZED_IMAGE_W?: number,
    public readonly LABEL_ASSIGNMENT?: DataExample[]
  ) {}
}

export type TaskID = string

export function isTaskID (obj: unknown): obj is TaskID {
  return typeof obj === 'string'
}

export class Task {
  static isTask (raw: unknown): raw is Task {
    if (typeof raw !== 'object') {
      return false
    }
    if (raw === null) {
      return false
    }

    if (!('taskID' in raw)) {
      return false
    }
    const { taskID, displayInformation } = raw as Record<'taskID' | 'displayInformation', unknown | undefined>

    if (typeof taskID !== 'string') {
      return false
    }
    if (displayInformation !== undefined &&
      !DisplayInformation.isDisplayInformation(displayInformation)) {
      return false
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = new Task(taskID, displayInformation)

    return true
  }

  private constructor (
    // TODO rename to ID
    public readonly taskID: TaskID,
    public readonly displayInformation?: DisplayInformation,
    public readonly trainingInformation?: TrainingInformation
  ) {}
}