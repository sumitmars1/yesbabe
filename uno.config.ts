import {
  defineConfig,
  presetUno,
  presetAttributify,
  presetIcons,
} from "unocss";

export default defineConfig({
  presets: [
    presetUno(), // Default UnoCSS preset
    presetAttributify(), // Optional: Enables attribute mode
    presetIcons(), // Optional: Enables icon usage
  ],
  // Define theme colors using CSS variables
  theme: {
    spacing: {
      // Page padding presets
      pageXPadding: "var(--page-x-padding)",
      pageYPadding: "var(--page-y-padding)",
      firstMargin: "var(--first-margin)",
      secondMargin: "var(--second-margin)",
      thirdMargin: "var(--third-margin)",
      // big card padding
      bigCardXPadding: "var(--big-card-x-padding)",
      bigCardYPadding: "var(--big-card-y-padding)",
      // large card padding
      largeCardXPadding: "var(--large-card-x-padding)",
      largeCardYPadding: "var(--large-card-y-padding)",
      // card padding
      cardXPadding: "var(--card-x-padding)",
      cardYPadding: "var(--card-y-padding)",
      // small card padding
      smallCardXPadding: "var(--small-card-x-padding)",
      smallCardYPadding: "var(--small-card-y-padding)",
    },
    //设置shadow
    boxShadow: {
      activeBorder: "var(--active-border)",
      border: 'var(--border)',
      hoverBorder: 'var(--hover-border)',
    },
    colors: {
      // Define semantic color names that map to CSS variables
      background: "var(--c-background)",
      bgSecondary: "var(--c-secondary-background)",
      invertBackground: "var(--c-invert-background)",
      invertText: "var(--c-invert-text)",
      roleCardBackground: "var(--c-role-card-backgournd)",
      appColor: "var(--c-app-color)", // Assuming you have a --c-app-color variable in your globa
      //c-soild-background
      soildBackground: "var(--c-soild-background)",
      primary: "var(--c-text-primary)",
      secondary: "var(--c-text-secondary)",
      // --c-hover-background
      hoverBackground: "var(--c-hover-background)",
      // --c-active-background
      activeBackground: "var(--c-active-background)",
      // Pink color for likes
      pink: "var(--c-pink-color)",
      sidebarBackground: "var(--sidebar-background)",
      btnBorder: "var(--btn-border)",

      // Menu Group
      menuBackground: "var(--menu-background)",
      menuItemBackground: "var(--menu-item-background)",
      menuItemHoverBackground: "var(--menu-item-hover-background)",
      menuItemText: "var(--menu-item-text)",
      menuItemActiveText: "var(--menu-item-active-text)",
      menuItemActiveBackground: "var(--menu-item-active-background)",
      // Add more semantic colors as needed

      cardBackground: "var(--card-background)",
      secondBackground: "var(--second-background)",
      
      // Chat content colors
      chatContentBackground: "var(--chat-content-background)",
      chatContentText: "var(--chat-content-text)",

      // Tabs text color
      tabsText: "var(--c-tabs-text)",

      // Select styles
      selectBorder: "var(--c-select-border)",
      selectText: "var(--c-select-text)",
    },
  },

  // Add custom rules or variants if necessary
  rules: [
    // Example of a custom rule if you need more control
    // ['bg-background', { 'background-color': 'var(--c-background)' }],
  ],
  shortcuts: [
    // Define common component styles using semantic colors
    // ['btn', 'px-4 py-2 rounded text-white bg-primary hover:bg-primary-dark'],

    // Menu Theme Group - 一个class控制整个menu样式组
    [
      "menu-theme",
      "bg-menuBackground border border-menuBorder shadow-menuShadow",
    ],
    [
      "menu-item",
      "bg-menuItemBackground text-menuItemText hover:bg-menuItemHoverBackground hover:text-menuItemText",
    ],
    ["menu-item-active", "bg-menuItemActiveBackground text-menuItemActiveText"],
    ["page-padding", "px-pageXPadding py-pageYPadding"],
    ["large-card", "px-largeCardXPadding py-largeCardYPadding"],
    ["card", "px-cardXPadding py-cardYPadding"],
    ["small-card", "px-smallCardXPadding py-smallCardYPadding"],
    // big card
    ["big-card", "px-bigCardXPadding py-bigCardYPadding"],
    
    // Chat content styles
    ["chat-content", "bg-chatContentBackground text-chatContentText"],
  ],
});
