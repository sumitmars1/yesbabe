<template>
  <div class="page-padding max-w-650px mx-auto text-primary">
    <!-- User Info -->
    <div class="flex flex-col items-center mb-firstMargin">
      <n-avatar round :size="96" :src="userInfo?.head_image" class="mb-thirdMargin" />
      <div class="text-2xl font-bold mb-thirdMargin">
        {{ userInfo?.user_name }}
      </div>
      <div class="text-secondary mb-thirdMargin">
        {{ userInfo?.email ? userInfo.email.replace(/(?<=^.{1}).+?(?=@) /g, '****') : '' }} </div>
          <BabeButton size="small" type="default" @click="showProfileModal = true">
            <svg-icon iconClass="Modify" class="mr-1"></svg-icon>
            {{ $t('profilePage.modify') }}
          </BabeButton>
      </div>
      <!-- Membership Card -->
      <div v-if="userInfo?.is_vip"
        class="bg-gradient-to-r from-[#7948EA] to-[#E05ADA] text-white big-card rounded-lg mb-firstMargin flex justify-between items-center">
        <div>
          <div class="font-bold mb-thirdMargin text-lg">{{ $t('profilePage.vipWelcome') }}</div>
          <div class="opacity-70">
            {{ $t('profilePage.vipExpiration') }}:
            {{
              dayjs(userInfo?.vip_expiration_time).format("YYYY-MM-DD HH:mm:ss")
            }}
          </div>
        </div>
        <BabeButton text-color="#fff" type="default" size="medium" color="#FFF" ghost @click="goToPremium">{{
          t('premium.premium.subscribe') }}</BabeButton>
      </div>
      <div v-else
        class="bg-gradient-to-r from-[#7948EA] to-[#E05ADA] text-white big-card rounded-lg mb-firstMargin flex justify-between items-center">
        <div>
          <div class="font-bold mb-thirdMargin text-lg">{{ $t('profilePage.subscribe') }}</div>
          <div class="opacity-70">{{ $t('profilePage.subscribePrice') }}</div>
        </div>
        <BabeButton text-color="#fff" type="default" size="medium" @click="goToPremium">{{ $t('profilePage.upgrade') }}
        </BabeButton>
      </div>

      <!-- Diamond Balance -->
      <div class="shadow-border big-card rounded-lg mb-firstMargin">
        <div class="">
          <div class="font-bold mb-secondMargin flex justify-between items-center w-full">
            <span>{{ $t('profilePage.myDiamonds') }}</span>
          </div>
          <div class="flex justify-between items-center">
            <div class="flex items-center">
              <svg-icon iconClass="diamond" :size="24" class="mr-2" />
              <span>{{ accountInfo?.tokens ?? 0 }}</span>
            </div>
            <div class="flex">
              <BabeButton type="default" size="medium" class="mr-4" @click="handleOpenConsumptionDetail">{{
                $t('profilePage.consumptionDetail') }}</BabeButton>
              <BabeButton type="default" size="medium" @click="goToPurchaseDiamonds">{{
                $t('profilePage.purchaseDiamonds') }}</BabeButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Purchased Collections -->
      <div class="shadow-border big-card rounded-lg mb-firstMargin">
        <div class="flex justify-between items-center cursor-pointer" @click="handleOpenPurchasedCollections">
          <div class="font-bold">{{ $t('profilePage.purchasedCollections') }}</div>
          <svg-icon iconClass="arrow-right" />
        </div>
      </div>

      <!-- Notification Settings -->
      <div class="shadow-border big-card rounded-lg mb-firstMargin">
        <div>
          <div class="font-bold mb-secondMargin flex justify-between items-center w-full">
            <span>{{ $t('profilePage.allowNotifications') }}</span>
            <n-switch :disabled="true" />
          </div>
          <div class="opacity-70">
            {{ $t('profilePage.notificationDesc') }}
          </div>
        </div>
      </div>

      <!-- Other Options -->
      <!-- Coupon Center -->
      <div class="shadow-border big-card rounded-lg mb-firstMargin" @click="goToCoupon">
        <div class="flex justify-between items-center cursor-pointer">
          <div class="font-bold">{{ $t('coupon.title') }}</div>
          <svg-icon iconClass="arrow-right" />
        </div>
      </div>

      <div class="shadow-border big-card rounded-lg mb-firstMargin">
        <div class="flex justify-between items-center cursor-pointer" @click="showChangePasswordModal = true">
          <div class="font-bold">{{ $t('profilePage.changePassword') }}</div>
          <svg-icon iconClass="arrow-right" />
        </div>
      </div>

      <div class="shadow-border big-card rounded-lg mb-firstMargin" @click="showDeleteAccountModal = true">
        <div class="flex justify-between items-center cursor-pointer">
          <div class="font-bold">{{ $t('profilePage.deleteAccount') }}</div>
          <svg-icon iconClass="arrow-right" />
        </div>
      </div>

      <!-- Logout Button -->
      <BabeButton type="secondary" class="mx-auto flex justify-center" @click="handleLogout">
        {{ $t('auth.logout') }}
      </BabeButton>

      <!-- Profile Modal -->
      <ProfileModal v-model:show="showProfileModal" />
      <ConsumptionDetailModal v-model:show="showConsumptionDetailModal" />
      <PurchasedCollectionsModal v-model:show="showPurchasedCollectionsModal" />
      <ChangePasswordModal v-model:show="showChangePasswordModal" />
      <DeleteAccountModal v-model:show="showDeleteAccountModal" @success="handleAccountDeleted" />
    </div>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { NAvatar, NSwitch } from "naive-ui";
import { useI18n } from 'vue-i18n';
import { useAuthStore } from "@/stores/auth";
import { useGlobalStore } from "@/stores/global/global";
import BabeButton from "@/components/BabeButton/index.vue";
import SvgIcon from "@/components/SvgIcon/index.vue";
import ProfileModal from "@/components/ProfileModal/index.vue";
import ConsumptionDetailModal from "@/components/ConsumptionDetailModal/index.vue";
import PurchasedCollectionsModal from "@/components/PurchasedCollectionsModal/index.vue";
import ChangePasswordModal from "@/components/ChangePasswordModal/index.vue";
import DeleteAccountModal from "@/components/DeleteAccountModal/index.vue";

const authStore = useAuthStore();
const globalStore = useGlobalStore();
const router = useRouter();
const message = (window as any).$message;
const { t } = useI18n();

const showProfileModal = ref(false);
const showConsumptionDetailModal = ref(false);
const showPurchasedCollectionsModal = ref(false);
const showChangePasswordModal = ref(false);
const showDeleteAccountModal = ref(false);

const userInfo = computed(() => authStore.userInfo);
const accountInfo = computed(() => authStore.accountInfo);

const handleAccountDeleted = async () => {
  await authStore.logout();
  // logout function now handles redirecting to home when necessary
  message.success(t('profilePage.accountDeleted'));
};

const handleLogout = async () => {
  try {
    await authStore.logout();
    // logout function now handles redirecting to home when necessary
    message.success(t('profilePage.logoutSuccess'));
  } catch (error) {
    console.error('登出失败:', error);
  }
};

const goToPremium = () => {
  router.push("/premium/pro");
};

const goToCoupon = () => {
  router.push("/coupon");
};

const goToPurchaseDiamonds = () => {
  router.push("/premium/diamonds");
};

const handleOpenPurchasedCollections = () => {
  if (globalStore.isMobile) {
    router.push("/profile/purchased-collections");
    return;
  }
  showPurchasedCollectionsModal.value = true;
};

const handleOpenConsumptionDetail = () => {
  if (globalStore.isMobile) {
    router.push("/profile/consumption-details");
    return;
  }
  showConsumptionDetailModal.value = true;
};

onMounted(() => {
  // 如果store中没有数据，则尝试获取
  if (!authStore.userInfo) {
    authStore.fetchUserInfo();
  }
  if (!authStore.accountInfo) {
    authStore.handleGetAccountInfo();
  }
});
</script>

<style scoped>
.shadow-border {
  box-shadow: var(--border);
}
</style>
