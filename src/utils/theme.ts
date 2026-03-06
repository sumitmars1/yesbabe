import { ref } from "vue";
// export const theme = ref(localStorage.getItem("theme") || "dark")
// export const toggleTheme = () => {
//     theme.value = theme.value === "dark" ? "light" : "dark"
//     // 保存到本地
//     localStorage.setItem("theme", theme.value)
// }
type Theme = 'light' | 'dark'

const themes: Record<Theme, Record<string, string>> = {
    light: {
        '--bg-color': '#ffffff',
        '--text-color': '#333333',
        '--primary-color': '#409eff'
    },
    dark: {
        '--bg-color': '#1a1a1a',
        '--text-color': '#ffffff',
        '--primary-color': '#66b1ff'
    }
}

export const useTheme = () => {
    const currentTheme = ref<Theme>('light')

    const applyTheme = (theme: Theme) => {
        const root = document.documentElement
        const themeVariables = themes[theme]

        Object.entries(themeVariables).forEach(([key, value]) => {
            root.style.setProperty(key, value)
        })

        currentTheme.value = theme
        localStorage.setItem('theme', theme)
    }

    const toggleTheme = () => {
        const newTheme = currentTheme.value === 'light' ? 'dark' : 'light'
        applyTheme(newTheme)
    }

    const initTheme = () => {
        const savedTheme = localStorage.getItem('theme') as Theme ||
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        applyTheme(savedTheme)
    }

    return {
        currentTheme,
        toggleTheme,
        initTheme
    }
}