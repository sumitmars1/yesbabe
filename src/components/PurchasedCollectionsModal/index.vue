<template>
  <n-config-provider
    :theme="themeStore.themeName === 'dark' ? darkTheme : undefined"
    :theme-overrides="{
      common: {
        ...themeStore.naiveOverridesTheme.common,
        borderRadius: '25px',
      },
    }"
  >
    <n-modal
      v-model:show="showModal"
      preset="card"
      class="collection-modal !w-[96vw] sm:!w-[88vw] max-h-[90vh] sm:max-h-[85vh]"
      :class="currentView === 'files' ? 'lg:!w-[90vw] lg:!max-w-[1200px]' : 'lg:!w-[80vw] lg:!max-w-[1000px]'"
      content-class="!max-h-[calc(90vh-100px)] sm:!max-h-[calc(85vh-120px)] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      :segmented="{ content: 'soft', footer: 'soft' }"
      @after-leave="handleModalClose"
    >
      <template #header>
        <div class="flex items-center">
          <n-button
            v-if="currentView === 'files'"
            quaternary
            circle
            class="mr-2"
            @click="handleBackToList"
          >
            <template #icon>
              <svg-icon iconClass="back" />
            </template>
          </n-button>
          <span>{{ modalTitle }}</span>
        </div>
      </template>
      <!-- List View -->
      <div v-if="currentView === 'list'">
        <div v-if="loading" class="flex items-center justify-center py-20">
          <n-spin size="large" />
        </div>
        <div v-else-if="!collections.length" class="flex flex-col items-center justify-center py-20">
          <svg-icon iconClass="folder-open" :size="64" class="text-secondary mb-4" />
          <p class="text-secondary">{{ t('collection.noPurchasedCollections') }}</p>
        </div>
        <div v-else class="[container-type:inline-size]">
          <div class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 justify-items-center sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] sm:gap-5">
            <PurchasedCollectionCard
              v-for="collection in collections"
              :key="collection.id"
              :collection="collection"
              @click="handleViewFiles"
            />
          </div>
        </div>
      </div>

      <!-- Files View -->
      <CollectionFilesView
        v-else-if="currentView === 'files'"
        :collection="currentCollectionDetail"
        :files="collectionFiles"
        :total-files="totalFiles"
        :loading="loadingFiles"
        @back="handleBackToList"
      />
    </n-modal>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NModal, NSpin, NConfigProvider, darkTheme, NButton } from 'naive-ui'
import { useThemeStore } from '@/stores/themeStore'
import PurchasedCollectionCard from '@/components/Collection/PurchasedCollectionCard.vue'
import CollectionFilesView from '@/components/Collection/CollectionFilesView.vue'
import { getPurchasedCollections, getCollectionFiles } from '@/api/collection'
import type { Collection, CollectionFile, CollectionDetail } from '@/api/collection/types'
import { useI18n } from 'vue-i18n'
import SvgIcon from '@/components/SvgIcon/index.vue'

const { t } = useI18n()
const themeStore = useThemeStore()

interface Props {
  show: boolean
}

const props = withDefaults(defineProps<Props>(), {
  show: false
})

const emit = defineEmits<{
  'update:show': [value: boolean]
}>()

const showModal = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

const currentView = ref<'list' | 'files'>('list')
const loading = ref(false)
const collections = ref<Collection[]>([])

// Files view state
const currentCollectionDetail = ref<CollectionDetail | null>(null)
const collectionFiles = ref<CollectionFile[]>([])
const totalFiles = ref(0)
const loadingFiles = ref(false)

const modalTitle = computed(() => {
  if (currentView.value === 'files' && currentCollectionDetail.value) {
    return currentCollectionDetail.value.title
  }
  return t('profilePage.purchasedCollections')
})

const fetchCollections = async () => {
  loading.value = true
  try {
    const res = await getPurchasedCollections()
    if (res.data) {
      collections.value = res.data.items || []
    }
  } catch (error) {
    console.error('Failed to fetch purchased collections', error)
  } finally {
    loading.value = false
  }
}

const handleViewFiles = async (collection: Collection) => {
  currentView.value = 'files'
  currentCollectionDetail.value = {
    ...collection,
    companion_id: collection.companion_id || 0 // ensure companion_id
  }
  loadingFiles.value = true
  try {
    const res = await getCollectionFiles(collection.id)
    if (res.data) {
      collectionFiles.value = res.data.files
      totalFiles.value = res.data.total_files
    }
  } catch (error) {
    console.error('Failed to fetch collection files', error)
  } finally {
    loadingFiles.value = false
  }
}

const handleBackToList = () => {
  currentView.value = 'list'
  currentCollectionDetail.value = null
  collectionFiles.value = []
}

const handleModalClose = () => {
  currentView.value = 'list'
  collections.value = []
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    fetchCollections()
  }
})
</script>
