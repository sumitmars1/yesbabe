import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { GlobalThemeOverrides } from "naive-ui";
const lightThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#7562FF',
    primaryColorHover: '#7562FF',
    borderRadius: '20px',
    primaryColorPressed: '#7562FF',
    hoverColor: "#F1F0FF"
    // --n-option-color-pending
  },
  LoadingBar: {
    colorLoading: '#7562FF',
    colorError: '#ff4757',
    height: '3px'
  }
}
const darkThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#7562FF',
    primaryColorHover: '#7562FF',
    borderRadius: '20px',
    primaryColorPressed: '#7562FF',
    hoverColor: "#575768"
  },
  LoadingBar: {
    colorLoading: '#7562FF',
    colorError: '#ff4757',
    height: '3px'
  }
}
export const useThemeStore = defineStore("theme", () => {
  // 当前主题名称
  const themeName = ref<"light" | "dark">("dark"); // Default to dark initially, will be set by initTheme
  const naiveOverridesTheme = computed(() => {
    if (themeName.value === "light") {
      return lightThemeOverrides;
    } else {
      return darkThemeOverrides;
    }
  })
  // 应用主题类名到根元素
  const applyTheme = (theme: "light" | "dark") => {
    const root = document.documentElement;
    // Clear old theme classes, keeping only 'dark' if needed
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    // Add transition classes (UnoCSS can handle these)
    // You might define these as a shortcut in unocss.config.ts for reusability
    root.classList.add("transition-all");
    root.classList.add("duration-1000");
    root.classList.add("ease-in-out");
  };


  // 切换主题的方法
  const toggleTheme = () => {
    themeName.value = themeName.value === "light" ? "dark" : "light";
    applyTheme(themeName.value); // 应用主题到 DOM
    localStorage.setItem("theme", themeName.value); // 持久化存储
  };

  // 初始化时应用主题，包含 localStorage 和系统偏好检查
  const initTheme = () => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;

    if (savedTheme) {
      // If theme is saved in localStorage, use it
      themeName.value = savedTheme;
    } else {
      // 如果没有保存的主题，默认使用dark主题
      themeName.value = 'dark';
    }

    // Apply the determined initial theme
    applyTheme(themeName.value);
  };

  return { themeName, toggleTheme, initTheme, naiveOverridesTheme };
});
