<template>
  <div class="space-y-8">
    <!-- test the model -->
    <ButtonCard
      class="mx-auto mt-10 lg:w-1/2"
      :click="assessModel"
      :button-placement="'center'"
    >
      <template #title>
        Test & validate your model
      </template>
      <template #text>
        By clicking the button below, you will be able to validate your model against a chosen dataset of yours.
      </template>
      <template #button>
        Test
      </template>
    </ButtonCard>

    <!-- display the chart -->
    <div class="p-4 mx-auto lg:w-1/2 h-full bg-white rounded-md">
      <!-- header -->
      <h4 class="p-4 border-b text-lg font-semibold text-slate-500">
        Test Accuracy
      </h4>
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
        :series="[{ data: accuracyData }]"
      />
    </div>

    <div
      v-if="validator?.confusionMatrix !== undefined"
      class="flex flex-col space-y-8"
    >
      <IconCard
        class="w-full lg:w-3/5 mx-auto"
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
                      p-3 border-l-2 border-disco-cyan
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
                <th class="text-center text-disco-cyan text-lg font-normal border-t-2 border-disco-cyan">
                  {{ task.trainingInformation.LABEL_LIST[i] }}
                </th>
                <td
                  v-for="(predictions, j) in row"
                  :key="j"
                  class="text-center text-lg p-3 border-l-2 border-t-2 border-disco-cyan"
                >
                  {{ predictions }}
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </IconCard>
      <IconCard
        v-if="numberOfClasses === 2"
        class="w-full lg:w-3/5 mx-auto"
      >
        <template #title>
          Evaluation Metrics
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <h3 class="font-bold">
                Sensitivity
              </h3><span>{{ validator.confusionMatrix[0] }}</span>
            </div>
            <div>
              <h3 class="font-bold">
                Specificity
              </h3><span>{{ validator.confusionMatrix[1] }}</span>
            </div>
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

import { useMemoryStore } from '@/store/memory'
import { useValidationStore } from '@/store/validation'
import { chartOptions } from '@/charts'
import { useToaster } from '@/composables/toaster'
import ButtonCard from '@/components/containers/ButtonCard.vue'
import IconCard from '@/components/containers/IconCard.vue'

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

const accuracyData = computed<number[]>(() => {
  const r = validator.value?.accuracyData
  return r !== undefined ? r.toArray() : [0]
})

const currentAccuracy = computed<string>(() => {
  const r = validator.value?.accuracy
  return r !== undefined ? (r * 100).toFixed(2) : '0'
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

</script>
