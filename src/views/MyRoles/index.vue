<template>
  <div class="page-padding max-w-800px mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-primary">{{ $t('myRoles.title') }}</h1>
    </div>

    <!-- 骨架屏加载状态 -->
    <div v-if="loading"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      <div v-for="i in 6" :key="i" class="h-[324px] rounded-2xl overflow-hidden max-w-[248px]">
        <n-skeleton class="w-full h-full" :sharp="false" />
      </div>
    </div>

    <!-- 角色列表 -->
    <div v-else
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      <!-- 新增角色卡片 -->
      <AddRoleCard />

      <!-- 已创建的角色卡片 -->
      <RoleCard v-for="role in roles" :key="role.id" :role-data="role" @click="handleRoleClick(role)" />

      <!-- 无数据提示 -->
      <div v-if="!loading && roles.length === 0" class="col-span-full py-8 text-center">
        <n-empty :description="$t('myRoles.noRoles')">
          <template #extra>
            <AddRoleCard />
          </template>
        </n-empty>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import RoleCard from "@/components/RoleCard/index.vue";
import AddRoleCard from "@/components/AddRoleCard/index.vue";
import { HomeListData } from "@/api/home/type";

// 角色数据结构
interface CreatedRole extends HomeListData {
  // 继承HomeListData，包含id等所有必要属性
}

const router = useRouter();
const loading = ref(true);
const roles = ref<CreatedRole[]>([]);

// 获取用户已创建角色的函数
const fetchCreatedRoles = async () => {
  try {
    loading.value = true;
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 模拟返回的数据 - 实际应该调用API获取用户创建的角色
    roles.value = [];

    loading.value = false;
  } catch (error) {
    console.error("获取已创建角色失败:", error);
    loading.value = false;
  }
};

// 处理角色点击事件
const handleRoleClick = (role: CreatedRole) => {
  // 跳转到角色详情或聊天页面
  // 需要根据实际路由结构调整
  router.push(`/chat/profile/${role.id}`);
};

onMounted(() => {
  fetchCreatedRoles();
});
</script>