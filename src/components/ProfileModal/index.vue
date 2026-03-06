<template>
  <n-config-provider
    :theme-overrides="{
      common: {
        heightLarge: '46px',
        borderRadius: '25px',
      },
    }"
  >
    <n-modal
      class="dialog-card"
      :show="show"
      @update:show="(val) => emit('update:show', val)"
      preset="card"
      :title="$t('profileModal.title')"
      style="width: 400px"
      :bordered="false"
    >
      <div class="mb-firstMargin">
        <div class="flex justify-center mb-secondMargin">
          <n-avatar round :size="80" :src="authStore.userInfo?.head_image" />
        </div>
        <!-- <div class="flex justify-center">
          <n-button size="small" round>Upload New Avatar</n-button>
        </div> -->
      </div>
      <n-input
        class="mb-secondMargin"
        size="large"
        type="text"
        v-model:value="formValue.name"
        :placeholder="$t('profileModal.namePlaceholder')"
        disabled
      ></n-input>
      <BabeButton type="primary" block round @click="handleSave">
        {{ $t('common.save') }}
      </BabeButton>
    </n-modal>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { NModal, NButton, NAvatar, useMessage } from "naive-ui";
import { useI18n } from 'vue-i18n';
import { useAuthStore } from "@/stores/auth";
import BabeButton from "@/components/BabeButton/index.vue";

const props = defineProps<{ show: boolean }>();
const emit = defineEmits(["update:show", "save"]);

const authStore = useAuthStore();
const message = useMessage();
const { t: $t } = useI18n();

const formValue = ref({
  avatar: "",
  name: "",
});

// 当弹窗显示时，用 authStore 的数据填充表单
watch(
  () => props.show,
  (newValue) => {
    if (newValue) {
      const userInfo = authStore.userInfo;
      if (userInfo) {
        formValue.value.avatar = userInfo?.head_image || ""; // 使用 head_image 字段
        formValue.value.name = userInfo?.user_name || ""; // 假设 userInfo 中有 name
      }
    }
  }
);

const handleSave = () => {
  // TODO: 对接后端的保存API
  message.info($t('profileModal.saveNotAvailable'));
  // 暂时只关闭弹窗
  emit("update:show", false);
};
</script>

<style scoped>
</style>
