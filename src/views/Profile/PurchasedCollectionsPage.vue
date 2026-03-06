<template>
  <div class="text-primary bg-background min-h-screen page-padding pb-20">
    <template v-if="currentView === 'list'">
      <div v-if="loading" class="flex items-center justify-center py-20">
        <n-spin size="large" />
      </div>
      <div
        v-else-if="!collections.length"
        class="flex flex-col items-center justify-center py-20"
      >
        <svg-icon iconClass="folder-open" :size="64" class="text-secondary mb-4" />
        <p class="text-secondary">{{ t("collection.noPurchasedCollections") }}</p>
      </div>
      <div v-else class="collection-grid-container">
        <div class="collection-grid">
          <PurchasedCollectionCard
            v-for="collection in collections"
            :key="collection.id"
            :collection="collection"
            @click="handleViewFiles"
          />
        </div>
      </div>
    </template>

    <template v-else>
      <CollectionFilesView
        :collection="collectionDetail"
        :files="collectionFiles"
        :total-files="totalFiles"
        :loading="loadingFiles"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { NSpin, useMessage } from "naive-ui";
import PurchasedCollectionCard from "@/components/Collection/PurchasedCollectionCard.vue";
import CollectionFilesView from "@/components/Collection/CollectionFilesView.vue";
import { getCollectionFiles, getPurchasedCollections } from "@/api/collection";
import type { Collection, CollectionDetail, CollectionFile } from "@/api/collection/types";

const { t } = useI18n();
const message = useMessage();

const currentView = ref<"list" | "files">("list");
const loading = ref(false);
const collections = ref<Collection[]>([]);

const collectionDetail = ref<CollectionDetail | null>(null);
const collectionFiles = ref<CollectionFile[]>([]);
const totalFiles = ref(0);
const loadingFiles = ref(false);

const fetchCollections = async () => {
  loading.value = true;
  try {
    const { data } = await getPurchasedCollections();
    collections.value = data?.items || [];
  } catch (error) {
    console.error("Failed to fetch purchased collections", error);
  } finally {
    loading.value = false;
  }
};

const handleViewFiles = async (collection: Collection) => {
  loadingFiles.value = true;
  currentView.value = "files";
  try {
    const { data } = await getCollectionFiles(collection.id);
    collectionDetail.value = data.collection;
    collectionFiles.value = data.files;
    totalFiles.value = data.total_files;
  } catch (error) {
    console.error("Failed to fetch collection files", error);
    currentView.value = "list";
  } finally {
    loadingFiles.value = false;
  }
};

onMounted(() => {
  fetchCollections();
});
</script>

<style scoped>
.collection-grid-container {
  container-type: inline-size;
}

.collection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  justify-items: center;
}

@media (min-width: 640px) {
  .collection-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
  }
}
</style>

