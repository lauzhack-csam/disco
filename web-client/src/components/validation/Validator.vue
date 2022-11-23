<template>
  <div class="flex flex-col gap-4 md:gap-8">
    <!-- test the model -->
    <ButtonCard
      class="w-full md:w-1/2 mx-auto"
      title-placement="center"
      @click="assessModel"
    >
      <template #title>
        Test & Validate Your Model
      </template>
      <template #text>
        Click the button below to evaluate your model against a chosen dataset of yours.
      </template>
      <template #button>
        Test
      </template>
    </ButtonCard>

    <!-- display the chart -->
    <IconCard>
      <template #title>
        Test Accuracy
      </template>
      <template #content>
        <!-- stats -->
        <div class="grid grid-cols-2 p-4 font-medium text-slate-500">
          <div class="text-center">
            <span class="text-2xl">{{ currentAccuracy }}</span>
            <span class="text-sm">% of test accuracy</span>
          </div>
          <div class="text-center">
            <span class="text-2xl">{{ visitedSamples }}</span>
            <span class="text-sm">&nbsp;samples visited</span>
          </div>
        </div>
        <!-- chart -->
        <apexchart
          width="100%"
          height="200"
          type="area"
          :options="chartOptions"
          :series="accuracyData"
        />
      </template>
    </IconCard>

    <div
      v-if="validator?.confusionMatrix !== undefined"
      class="flex flex-col space-y-8"
    >
      <IconCard
        title-placement="center"
        class="w-full md:w-3/5 mx-auto"
      >
        <template #title>
          Confusion Matrix ({{ numberOfClasses }}x{{ numberOfClasses }})
        </template>
        <template #content>
          <table class="auto border-collapse w-full">
            <thead>
              <tr>
                <td />
                <td
                  v-for="(_, i) in validator.confusionMatrix"
                  :key="i"
                  class="
                    text-center text-disco-cyan text-lg font-normal
                    p-3 uppercase
                  "
                >
                  {{ task.trainingInformation.LABEL_LIST[i] }}
                </td>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, i) in validator.confusionMatrix"
                :key="i"
              >
                <th class="text-center text-disco-cyan text-lg font-normal uppercase">
                  {{ task.trainingInformation.LABEL_LIST[i] }}
                </th>
                <td
                  v-for="(predictions, j) in row"
                  :key="j"
                  class="text-center text-lg p-3"
                >
                  {{ predictions }}
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </IconCard>
      <div
        v-if="numberOfClasses === 2"
        class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8"
      >
        <IconCard title-placement="center">
          <template #title>
            Sensitivity
          </template>
          <template #content>
            <div class="flex flex-col gap-4 md:gap-8">
              Short text explaining what sensitivity is ...
              <span class="mx-auto">
                Sensitivity for label "{{ task.trainingInformation.LABEL_LIST[0] }}"&nbsp;&nbsp;
                <span class="text-2xl">{{ roundedDecimal(sensitivity(validator.confusionMatrix, 0)) }}</span>%
              </span>
              <span class="mx-auto">
                Sensitivity for label "{{ task.trainingInformation.LABEL_LIST[1] }}"&nbsp;&nbsp;
                <span class="text-2xl">{{ roundedDecimal(sensitivity(validator.confusionMatrix, 1)) }}</span>%
              </span>
            </div>
          </template>
        </IconCard>
        <IconCard title-placement="center">
          <template #title>
            F1-Score
          </template>
          <template #content>
            <div class="flex flex-col gap-4 md:gap-8">
              Short text explaining what the F1-score is ...
              <span class="mx-auto">
                F1-score for label "{{ task.trainingInformation.LABEL_LIST[0] }}"&nbsp;&nbsp;
                <span class="text-2xl">{{ roundedDecimal(F1Score(validator.confusionMatrix, 0)) }}</span>%
              </span>
              <span class="mx-auto">
                F1-score for label "{{ task.trainingInformation.LABEL_LIST[1] }}"&nbsp;&nbsp;
                <span class="text-2xl">{{ roundedDecimal(F1Score(validator.confusionMatrix, 1)) }}</span>%
              </span>
            </div>
          </template>
        </IconCard>
      </div>
      <IconCard
        v-else
        title-placement="center"
        class="w-full md:w-1/2 mx-auto"
      >
        <template #title>
          Macro F1-Score
        </template>
        <template #content>
          <div class="flex flex-col gap-4 md:gap-8">
            Short text explaining what the macro F1-score is ...
            <span class="mx-auto">
              <span class="text-2xl">100</span>%
            </span>
          </div>
        </template>
      </IconCard>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed, defineProps, ref } from 'vue'
import { storeToRefs } from 'pinia'

import { browser, data, ConsoleLogger, EmptyMemory, Memory, Task, Validator } from '@epfml/discojs'

import { chartOptions } from '@/charts'
import { useMemoryStore } from '@/store/memory'
import { useValidationStore } from '@/store/validation'
import { useToaster } from '@/composables/toaster'
import IconCard from '@/components/containers/IconCard.vue'
import ButtonCard from '@/components/containers/ButtonCard.vue'

const { useIndexedDB } = storeToRefs(useMemoryStore())
const toaster = useToaster()
const validationStore = useValidationStore()

interface Props {
  task: Task
  datasetBuilder?: data.DatasetBuilder<File>
}
const props = defineProps<Props>()

const validator = ref<Validator | undefined>(undefined)

const numberOfClasses = computed<number>(() =>
  props.task.trainingInformation.LABEL_LIST?.length ?? 2)

const memory = computed<Memory>(() =>
  useIndexedDB ? new browser.IndexedDB() : new EmptyMemory())

const accuracyData = computed<[{ data: number[] }]>(() => {
  const r = validator.value?.accuracyData
  return [{
    data: r !== undefined
      ? r.map((e) => e * 100).toArray()
      : [0]
  }]
})

const currentAccuracy = computed<string>(() => {
  const r = validator.value?.accuracy
  return r !== undefined ? roundedDecimal(r) : '0'
})

const visitedSamples = computed<number>(() => {
  const r = validator.value?.visitedSamples
  return r !== undefined ? r : 0
})

async function getValidator (): Promise<Validator | undefined> {
  if (validationStore.model === undefined) {
    return undefined
  }
  return new Validator(props.task, new ConsoleLogger(), memory.value, validationStore.model)
}

async function assessModel (): Promise<void> {
  if (props.datasetBuilder?.size() === 0) {
    return toaster.error('No file was given')
  }

  const v = await getValidator()
  if (v !== undefined) {
    validator.value = v
  } else {
    return toaster.error('Model was not found')
  }

  const testingSet: data.Data = (await props.datasetBuilder.build()).train

  toaster.success('Model testing started')

  try {
    await validator.value?.assess(testingSet, numberOfClasses.value <= 8)
  } catch (e) {
    toaster.error(e instanceof Error ? e.message : e.toString())
  }
}

const roundedDecimal = (nbr: number, decimals: number = 2): string =>
  (nbr * 100).toFixed(decimals)

const sensitivity = (matrix: number[][], l: number): number =>
  matrix[l][l] / (matrix[l][l] + matrix[l][1 - l])

const F1Score = (matrix: number[][], l: number): number =>
  2 * matrix[l][l] / (2 * matrix[l][l] + matrix[1 - l][l] + matrix[l][1 - l])

</script>
