// 默认图片缓存服务

const DEFAULT_IMAGES_KEY = 'default_images_cache'
const DEFAULT_IMAGES_TIMESTAMP_KEY = 'default_images_timestamp'

// 缓存过期时间（24小时）
const CACHE_EXPIRY = 24 * 60 * 60 * 1000

// 默认图片列表（通过 import 引用）
const DEFAULT_IMAGE_URLS = [
]

export const preloadDefaultImages = async (): Promise<string[]> => {
  try {
    // 检查缓存是否存在且未过期
    const cached = localStorage.getItem(DEFAULT_IMAGES_KEY)
    const timestamp = localStorage.getItem(DEFAULT_IMAGES_TIMESTAMP_KEY)

    if (cached && timestamp) {
      const cacheAge = Date.now() - parseInt(timestamp)
      if (cacheAge < CACHE_EXPIRY) {
        console.log('[默认图片] 使用缓存的图片')
        return JSON.parse(cached)
      }
    }

    console.log('[默认图片] 开始预加载图片')

    // 预加载所有图片
    const imagePromises = DEFAULT_IMAGE_URLS.map((imageUrl) => {
      return new Promise<string>((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          resolve(imageUrl)
        }
        img.onerror = () => {
          console.error(`[默认图片] 加载失败: ${imageUrl}`)
          resolve(imageUrl) // 即使加载失败也返回URL，可能网络问题但本地文件存在
        }
        img.src = imageUrl
      })
    })

    const images = await Promise.all(imagePromises)

    if (images.length > 0) {
      localStorage.setItem(DEFAULT_IMAGES_KEY, JSON.stringify(images))
      localStorage.setItem(DEFAULT_IMAGES_TIMESTAMP_KEY, Date.now().toString())
      console.log(`[默认图片] 成功缓存 ${images.length} 张图片`)
    }

    return images
  } catch (error) {
    console.error('[默认图片] 预加载失败:', error)
    // 发生错误时，返回原始的静态图片 URL
    return DEFAULT_IMAGE_URLS
  }
}

export const getRandomDefaultImage = (): string | null => {
  try {
    const cached = localStorage.getItem(DEFAULT_IMAGES_KEY)
    if (!cached) {
      console.log('[默认图片] 缓存为空')
      return null
    }

    const images = JSON.parse(cached)
    if (!Array.isArray(images) || images.length === 0) {
      console.log('[默认图片] 缓存中无有效图片')
      return null
    }

    const randomIndex = Math.floor(Math.random() * images.length)
    return images[randomIndex]
  } catch (error) {
    console.error('[默认图片] 获取随机图片失败:', error)
    return null
  }
}

export const clearDefaultImageCache = () => {
  localStorage.removeItem(DEFAULT_IMAGES_KEY)
  localStorage.removeItem(DEFAULT_IMAGES_TIMESTAMP_KEY)
  console.log('[默认图片] 已清除缓存')
}

// 导出默认图片数量
export const getDefaultImageCount = (): number => {
  try {
    const cached = localStorage.getItem(DEFAULT_IMAGES_KEY)
    if (!cached) return 0
    const images = JSON.parse(cached)
    return Array.isArray(images) ? images.length : 0
  } catch {
    return 0
  }
}
