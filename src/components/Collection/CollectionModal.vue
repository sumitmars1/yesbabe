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
      class="collection-modal !w-[96vw] sm:!w-[90vw] max-h-[90vh]"
      :class="currentView === 'files' ? '!max-w-[1200px]' : '!max-w-[1000px]'"
      content-class="!max-h-[calc(90vh-100px)] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
    <!-- 合集列表视图 -->
    <div v-if="currentView === 'list'" class="flex flex-col h-full">
      <!-- 加载状态 -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <n-spin size="large" />
      </div>

      <!-- 空状态 -->
      <div v-else-if="!collections.length" class="flex flex-col items-center justify-center py-20">
        <svg-icon iconClass="folder-open" :size="64" class="text-secondary mb-4" />
        <p class="text-secondary">{{ t('collection.noCollections') }}</p>
      </div>

      <!-- 合集网格容器 -->
      <div v-else class="w-full">
        <div class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
          <!-- 未购买的合集 -->
          <CollectionCard
            v-for="collection in unpurchasedCollections"
            :key="collection.id"
            :collection="collection"
            :loading="purchasingId === collection.id"
            @purchase="handlePurchase"
            @click="handleCollectionClick"
          />

          <!-- 已购买的合集 -->
          <PurchasedCollectionCard
            v-for="collection in purchasedCollections"
            :key="collection.id"
            :collection="collection"
            @click="handleViewFiles"
          />
        </div>
      </div>
    </div>

    <!-- 合集文件视图 -->
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
import { NModal, NSpin, useMessage, NConfigProvider, NButton } from 'naive-ui'
import { darkTheme } from 'naive-ui'
import { useThemeStore } from '@/stores/themeStore'
import CollectionCard from './CollectionCard.vue'
import PurchasedCollectionCard from './PurchasedCollectionCard.vue'
import CollectionFilesView from './CollectionFilesView.vue'
import { getCollections, getCollectionFiles, purchaseCollection } from '@/api/collection'
import type { Collection, CollectionFile, CollectionDetail } from '@/api/collection/types'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const message = useMessage()
const themeStore = useThemeStore()

interface Props {
  show: boolean
  companionId?: number
}

const props = withDefaults(defineProps<Props>(), {
  show: false
})

const emit = defineEmits<{
  'update:show': [value: boolean]
}>()

// 控制模态框显示
const showModal = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

// 当前视图：'list' | 'files'
const currentView = ref<'list' | 'files'>('list')

// 合集列表数据
const collections = ref<Collection[]>([])
const companionName = ref('')
const loading = ref(false)

// 合集文件数据
const currentCollectionDetail = ref<CollectionDetail | null>(null)
const collectionFiles = ref<CollectionFile[]>([])
const totalFiles = ref(0)
const loadingFiles = ref(false)

// 购买中的合集ID
const purchasingId = ref<number | null>(null)

// 计算属性：已购买和未购买的合集
const purchasedCollections = computed(() => 
  collections.value.filter(c => c.is_purchased)
)

const unpurchasedCollections = computed(() => 
  collections.value.filter(c => !c.is_purchased)
)

// 模态框标题
const modalTitle = computed(() => {
  if (currentView.value === 'files') {
    return currentCollectionDetail.value?.title || t('collection.collectionFiles')
  }
  return companionName.value 
    ? t('collection.collectionsOf', { name: companionName.value })
    : t('collection.collections')
})

// 加载合集列表
const loadCollections = async () => {
  if (!props.companionId) return
  
  loading.value = true
  try {
    const { data } = await getCollections(props.companionId)
    collections.value = data.collections
    companionName.value = data.companion_name
  } catch (error) {
    console.error('加载合集列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载合集文件
const loadCollectionFiles = async (collectionId: number) => {
  loadingFiles.value = true
  try {
    const { data } = await getCollectionFiles(collectionId)
    currentCollectionDetail.value = data.collection
    collectionFiles.value = data.files
    totalFiles.value = data.total_files
    currentView.value = 'files'
  } catch (error) {
    console.error('加载合集文件失败:', error)
  } finally {
    loadingFiles.value = false
  }
}

// 处理购买
const handlePurchase = async (collectionId: number) => {
  purchasingId.value = collectionId
  try {
    const { data } = await purchaseCollection(collectionId)
    message.success(t('collection.purchaseSuccess'))
    
    // 更新本地状态
    const collection = collections.value.find(c => c.id === collectionId)
    if (collection) {
      collection.is_purchased = true
    }
    
    // 重新加载列表以确保数据同步
    await loadCollections()
  } catch (error) {
    console.error('购买失败:', error)
  } finally {
    purchasingId.value = null
  }
}

// 处理查看文件
const handleViewFiles = (collection: Collection) => {
  loadCollectionFiles(collection.id)
}

// 处理合集卡片点击（可用于未来扩展）
const handleCollectionClick = (collection: Collection) => {
  // 可以在这里添加其他逻辑，比如显示详情等
  console.log('Collection clicked:', collection)
}

// 返回到列表
const handleBackToList = () => {
  currentView.value = 'list'
  currentCollectionDetail.value = null
  collectionFiles.value = []
  totalFiles.value = 0
}

// 模态框关闭时重置状态
const handleModalClose = () => {
  currentView.value = 'list'
  collections.value = []
  companionName.value = ''
  currentCollectionDetail.value = null
  collectionFiles.value = []
  totalFiles.value = 0
}

// 监听模态框显示状态，自动加载数据
watch(() => props.show, (newShow) => {
  if (newShow && props.companionId) {
    loadCollections()
  }
})
</script>

