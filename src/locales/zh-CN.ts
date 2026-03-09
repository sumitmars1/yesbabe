export default {
  time: {
    justNow: '刚刚',
    minutesAgo: '{n}分钟前',
    hoursAgo: '{n}小时前',
    daysAgo: '{n}天前',
    weeksAgo: '{n}周前'
  },
  common: {
    confirm: '确认',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    add: '添加',
    search: '搜索',
    reset: '重置',
    submit: '提交',
    back: '返回',
    next: '下一步',
    prev: '上一步',
    loading: '加载中...',
    success: '操作成功',
    error: '操作失败',
    warning: '警告',
    info: '信息',
    tips: '提示',
    yes: '是',
    no: '否'
  },
  auth: {
    login: '登录',
    register: '注册',
    logout: '退出登录',
    email: '邮箱',
    password: '密码',
    confirmPassword: '确认密码',
    forgotPassword: '忘记密码',
    resetPassword: '重置密码',
    verificationCode: '验证码',
    sendCode: '发送验证码',
    resendCode: '重新发送',
    loginSuccess: '登录成功',
    registerSuccess: '注册成功',
    logoutSuccess: '退出登录成功',
    invalidCredentials: '用户名或密码错误',
    emailRequired: '请输入邮箱',
    passwordRequired: '请输入密码',
    confirmPasswordRequired: '请确认密码',
    passwordMismatch: '两次输入的密码不一致',
    verificationCodeRequired: '请输入验证码',
    countdownText: '秒后重新发送'
  },
  menu: {
    home: '首页',
    chat: '聊天',
    generator: '图像生成',
    creator: '创建者',
    premium: '订阅',
    faq: '常见问题',
    settings: '设置',
    language: '语言',
    theme: '主题',
    lightMode: '浅色模式',
    darkMode: '深色模式',
    explore: '探索',
    create: '创建AI',
    myAI: '我的AI',
    aiGenerator: '图像生成',
    termsOfService: '服务条款',
    discount70: '7折优惠',
    discountPercentOff: '最高{percent}%折扣'
  },
  chat: {
    newChat: '新建聊天',
    sendMessage: '发送消息',
    typing: '正在输入...',
    messageHistory: '消息历史',
    clearHistory: '清空历史',
    deleteChat: '删除聊天',
    renameChat: '重命名聊天',
    copyMessage: '复制消息',
    regenerate: '重新生成',
    startChat: '开始聊天吧！',
    quickTip: '💡 快速提示：您可以通过左侧列表切换不同的聊天伙伴',
    sayMessage: '说点什么',
    isReplying: 'AI正在回复中，请稍候...',
    suggestedReplies: '推荐回复',
    showMe: '发我一张图片',
    sendMe: '发我一个视频',
    canSee: '我能',
    connectionStatus: {
      connected: '已连接',
      connecting: '连接中',
      disconnected: '已断开',
      unknown: '未知'
    },
    unknownOperation: '未知操作：',
    searchPlaceholder: '搜索联系人...',
    noMatchingRecords: '未找到匹配的聊天记录',
    noChatHistory: '暂无聊天记录',
    tryOtherKeywords: '尝试使用其他关键词搜索',
    startFirstConversation: '开始您的第一次对话吧'
  },
  chatItem: {
    generatingReply: '正在生成回复...',
    generationError: '生成错误：',
    regenerateError: '生成错误，请重新生成',
    imageRequestDetected: '检测到图片生成请求，处理中...',
    generatingImage: '正在生成图片...',
    unknownError: '发生未知错误',
    createAIVideo: '创建AI视频',
    generatingVideo: '正在生成视频',
    videoRequestSent: '视频生成请求已发送',
    maskedTitle: '内容已打码',
    maskedTextPlaceholder: '升级PRO, 解锁私密文字',
    maskedImagePlaceholder: '升级PRO, 解锁私密图片',
    maskedVideoPlaceholder: '升级PRO, 解锁私密视频',
    upgradeToUnlock: '立即升级',
    openPro: '开通Pro',
    messageItemHiddenText: '升级 Pro,解锁私密文字',
    messageItemHiddenImage: '升级 Pro,解锁私密图片',
    messageItemHiddenVideo: '升级 Pro,解锁私密视频',
    messageItemImage: '[图片]',
    messageItemVideo: '[视频]',
    messageItemCollection: '[合集]',
    messageItemImageCollection: '[图片合集]',
    messageItemVideoCollection: '[视频合集]',
    messageItemMarkAsReadError: '标记已读失败',
    messageItemSwitchToChat: '切换到聊天对象',
    textToSpeech: '文字转语音',
    generating: '生成中...',
    playing: '播放中',
    paused: '已暂停',
    ttsError: '语音生成失败',
    generatingContentWarning: '内容正在生成中，离开将丢失该内容，是否继续？',
    waitingInQueue: '正在排队中...'
  },
  collectionMessage: {
    price: '价格：{price}',
    images: '{count} 张图片',
    videos: '{count} 个视频',
    buy: '购买合集',
    purchasing: '购买中...',
    purchaseFailed: '购买失败，请稍后重试',
    purchased: '已购买',
    assetsTitle: '合集内容',
    empty: '暂无可展示的文件',
    coverAlt: '合集封面',
    defaultTitle: '合集推荐',
    viewAll: '查看全部',
    modalImages: '图片',
    modalVideos: '视频'
  },
  collection: {
    collections: '合集列表',
    collectionsOf: '{name}的合集',
    files: '个文件',
    filesCount: '个文件',
    purchase: '购买',
    confirmPurchase: '确认购买',
    purchased: '人已购买',
    owned: '已拥有',
    view: '查看',
    noCollections: '暂无合集',
    noFiles: '暂无文件',
    loadError: '加载合集列表失败',
    loadFilesError: '加载合集文件失败',
    purchaseSuccess: '购买成功',
    purchaseError: '购买失败',
    purchaseTimeout: '购买请求超时，请重试',
    collectionFiles: '合集文件',
    noPurchasedCollections: '暂无已购买的合集'
  },
  creator: {
    body: {
      selectBody: '选择体型',
      selectBust: '选择胸围',
      selectHip: '选择臀围'
    },
    hair: {
      selectHairStyle: '选择发型',
      selectHairColor: '选择发色'
    },
    personality: {
      selectPersonality: '选择性格'
    },
    race: {
      selectRace: '选择种族',
      selectAge: '选择年龄',
      eyeColor: '眼睛颜色'
    },
    relationship: {
      selectRelationship: '选择关系'
    },
    style: {
      selectYourFavoriteStyle: '选择你喜欢的风格',
      loading: '加载风格列表中...'
    },
    creatorIndex: {
      prev: '上一步',
      next: '下一步'
    },
    create: '创建',
    creating: '创建中',
    loading: '加载中...'
  },
  createdModels: {
    noModels: '还没有创建AI模型',
    fetchFailed: '获取创建的AI模型失败：',
    startChatting: '开始聊天吧！',
    loading: '加载模型列表中...'
  },
  profile: {
    userProfile: '用户资料',
    generateImage: '图像生成',
    voiceChat: '语音聊天',
    aboutMe: '关于我',
    age: '年龄',
    language: '语言',
    relationship: '关系',
    ethnicity: '种族',
    hobby: '爱好',
    occupation: '职业',
    bodyType: '体型',
    personality: '性格'
  },
  generator: {
    title: '图像生成',
    prompt: '提示词',
    generate: '生成',
    generating: '生成中...',
    download: '下载',
    style: '风格',
    size: '尺寸',
    quality: '质量',
    generateImage: '图像生成',
    customizeStyle: '根据你喜欢的风格自定义',
    expand: '展开',
    collapse: '收起',
    generateImageCount: '生成图片数量',
    generateButton: '图像生成',
    viewResults: '查看结果',
    selectModel: '选择',
    cancel: '取消',
    confirm: '确认',
    noData: '暂无内容',
    female: '女性',
    male: '男性',
    generationResults: '生成结果',
    noResults: '暂无生成结果',
    configureAndGenerate: '请在左侧配置参数并生成图片',
    generatedImage: '生成的图片',
    cost: '消耗',
    vipRequired: '需要Pro订阅',
    vipRequiredDesc: '此功能仅Pro订阅可用，请先订阅Pro',
    goToVip: '立即订阅',
    insufficientTokens: '钻石不足',
    insufficientTokensDesc: '您的钻石余额不足，请先充值',
    goToPurchase: '立即充值',
    result: {
      unfinishedTask: '检测到未完成的生成任务',
      continueGenerating: '继续',
      generatingMessage: '请稍候，我们正在为您生成图片。您可以离开此页面，生成仍会继续进行。',
      allImagesCompleted: '所有图片已生成完成！您可以查看结果或开始新的生成任务。',
      generationFailedMessage: '生成过程中遇到问题，您可以重试或开始新任务。',
      findYourImages: '您可以在这里找到您的图片。您可以在其他页面仍在加载时离开页面或开始新的系列。',
      generationFailed: '生成失败',
      retry: '重试',
      completedCount: '已完成 {completed} / {total}',
      remainingCount: '剩余 {remaining}',
      allCompleted: '全部完成',
      totalImages: '共 {count} 张图片',
      generating: '生成中...',
      completed: '已完成',
      failed: '失败',
      preparing: '准备中...',
      batchGeneration: '批量生成',
      generationProgress: '生成进度',
      pagination: {
        totalImages: '共 {total} 张图片',
        loading: '加载中...',
        pageSize: '每页显示',
        jumpTo: '跳至',
        page: '页'
      },
      loading: '加载中...',
      restartGeneration: '重新开始生成',
      noRetriableTask: '当前没有可重试的任务',
      retryFailed: '重试失败，请稍后再试',
      imageGenerationFailed: '图片生成失败',
      imageGenerationCompleted: '图片生成完成！',
      networkDisconnected: '网络连接断开',
      networkDisconnectedDesc: '网络连接断开，请检查网络后重试',
      fetchHistoryFailed: '获取历史数据失败',
      refreshHistoryFailed: '刷新图片历史失败',
      requestCanceled: '图片历史请求被取消，忽略错误'
    }
  },
  myRoles: {
    title: '我的角色',
    noRoles: '还没有创建角色',
    loading: '加载中...'
  },
  deleteAccountModal: {
    title: '注销账户',
    warning: '警告：此操作不可逆！',
    accountAssets: '您的账户包含 {tokens} 钻石等资产，注销后将无法恢复。',
    reason: '注销原因',
    selectReason: '请选择注销原因',
    otherReason: '请输入其他原因',
    password: '请输入密码',
    enterPassword: '请输入您的密码',
    confirmation: '确认操作',
    enterConfirmation: "请输入 'DELETE MY ACCOUNT' 以确认",
    confirmDelete: '确认注销',
    reasons: {
      notNeeded: '不再需要',
      featureLack: '功能不满足需求',
      privacy: '隐私担忧',
      other: '其他'
    },
    validation: {
      selectReason: '请选择注销原因',
      enterOtherReason: '请输入其他原因',
      enterPassword: '请输入密码',
      enterConfirmation: "请输入 'DELETE MY ACCOUNT' 以确认",
      confirmationText: '请输入正确的确认文本'
    },
    success: '账户已成功注销',
    error: '注销失败，请稍后再试'
  },
  faq: {
    title: 'Yesbabe AI <span class="faq-title-highlight">FAQ</span>',
    items: {
      whatIsYesbabeAI: {
        question: 'Yesbabe AI 是什么？',
        answer: 'Yesbabe.ai 是最好的 AI 女友应用，让您可以创建个性化的虚拟伴侣，或在安全私密的空间内，与我们逼真的 AI 角色进行沉浸式、无审查的幻想体验即时连接。'
      },
      isYesbabeAILegitimate: {
        question: 'Yesbabe AI 合法且使用安全吗？',
        answer: '是的，Yesbabe AI 是合法的服务。它采用加密交易，遵守符合 GDPR 的数据隐私标准，并使用谨慎的账单方式来确保用户的安全和保密。'
      },
      bankStatements: {
        question: 'Yesbabe AI 将如何显示在我的银行对账单上？',
        answer: '交易经过安全处理，并以中性商户名称显示。您的银行对账单上不会直接提及 Yesbabe AI 或其服务，从而确保用户隐私。'
      },
      customizeExperience: {
        question: '我可以自定义我的 Yesbabe AI 体验吗？',
        answer: '是的，Yesbabe AI 提供强大的自定义选项。用户可以通过“创建我的 AI 女友”功能设计自己的伴侣，选择种族、发型、声音、性格特征等偏好。'
      },
      whoUsesYesbabeAI: {
        question: '谁在使用 Yesbabe AI，目的是什么？',
        answer: 'Yesbabe AI 吸引了广泛的用户。有些人寻求陪伴或情感支持，而另一些人则将其用于讲故事、创意写作或角色扮演。此外，AI 爱好者也会探索它以更好地了解对话式 AI 的能力。'
      },
      whatIsAICompanion: {
        question: '什么是 AI 伴侣，我可以创建自己的伴侣吗？',
        answer: 'AI 伴侣是由人工智能驱动的虚拟角色，可以对话、响应情绪提示并随着不断的互动而进化。通过 Yesbabe AI，用户可以完全个性化其伴侣的外观、行为和偏好。'
      },
      multimodalInteraction: {
        question: '我的 AI 伴侣可以发送图片、视频或语音消息吗？',
        answer: '是的，Yesbabe AI 支持多模态交互。您的伴侣可以进行语音对话，生成个性化图像，并出现在根据您的输入和偏好定制的 AI 生成视频中。'
      },
      roleplay: {
        question: '我可以与我的 AI 伴侣进行角色扮演吗？',
        answer: '当然可以。Yesbabe AI 支持各种各样的角色扮演场景，从随意的互动和叙事发展到沉浸式讲故事。AI 会根据用户的提示和主题动态调整。但是，请注意，您正在与一个根据您引导的对话进行响应的 AI 角色聊天。这里的互动是虚构的、自愿的，并且必须遵守我们的 https://yesbabe.ai/community-guidelines 。'
      },
      whatIsAIGirlfriend: {
        question: '什么是 AI 女友，它是如何工作的？',
        answer: 'AI 女友是由深度学习和情商驱动的数字角色，旨在以有意义的方式与您聊天、调情和联系。在 Yesbabe AI，您的 AI 女友会适应您的风格、偏好和心情，创造出自然且情感真实的个人体验。'
      },
      personalities: {
        question: '我可以选择不同的 AI 女友性格吗？',
        answer: '是的，Yesbabe AI 提供多种预构建的 AI 女友角色选择，每个角色都有独特的性格、沟通风格和氛围。无论您喜欢甜美、挑逗、轻声细语还是大胆的类型，您都能找到与您能量相匹配的 AI 女友。'
      },
      howAIGFLearns: {
        question: '我的 AI 女友如何了解我？',
        answer: '您的 AI 女友通过对话学习。您聊得越多，她就越能了解您的偏好、语气和兴趣。随着时间的推移，她会调整她的反应和行为，以更好地匹配您的沟通风格，使每次聊天更加个性化。'
      },
      privacyAndSecurity: {
        question: '与 AI 女友聊天是私密和安全的吗？',
        answer: '当然。Yesbabe AI 使用端到端加密来保持所有 AI 女友对话的安全和机密。您可以完全控制您的聊天记录，并可以启用双重身份验证以获得额外的安全性。您的数据绝不会被共享或出售。'
      },
      installation: {
        question: '我需要安装任何东西才能与我的 AI 女友交谈吗？',
        answer: '无需安装。您可以随时随地通过桌面或移动设备直接访问 Yesbabe AI 上的 AI 女友。只需注册，选择您的 AI 女友，即可立即开始聊天。'
      }
    }
  },
  home: {
    filter: {
      newest: '最新',
      hottest: '热门',
      recommend: '推荐'
    },
    noData: '暂无数据',
    carousel: {
      title1: '创建AI',
      desc1: '个性化定制',
      title2: '首次订阅',
      desc2: '最高{percent}折扣',
      title3: '私密主题',
      desc3: '立即解锁'
    }
  },
  infinityScroll: {
    loadMore: '点击加载更多',
    loadText: '点击加载更多',
    loading: '加载中...',
    loadingText: '历史消息加载中...',
    finished: '',
    noData: '暂无内容'
  },
  mediaDisplay: {
    videoNotSupported: '您的浏览器不支持视频标签。'
  },
  modelCard: {
    videoNotSupported: '您的浏览器不支持视频标签。',
    age: '岁',
    liked: '已点赞',
    notLiked: '未点赞',
    latest: '最新'
  },
  messageQuotaModal: {
    title: '免费消息次数已用完',
    description: '您的免费消息次数已用完，请订阅Pro享受更多权益',
    proBenefitsTitle: 'Pro订阅权益',
    benefits: {
      monthlyDiamonds: '每月赠送{amount}钻石（共{total}个）',
      voiceCall: 'AI实时语音通话',
      createPersonalizedAI: '创建个性化AI女友',
      unlimitedChat: '无限制的短信和语音交流',
      generateImages: '生成图像和解锁私密视频'
    },
    later: '稍后再说',
    upgradeNow: '立即订阅Pro'
  },
  profilePage: {
    userProfile: '用户资料',
    modify: '修改',
    vipWelcome: '尊敬的Pro订阅！',
    vipExpiration: 'Pro到期',
    subscribe: '订阅',
    subscribePrice: '起价$4.99/月',
    upgrade: '升级体验',
    myDiamonds: '我的钻石',
    consumptionDetail: '消费明细',
    purchaseDiamonds: '购买钻石',
    allowNotifications: '允许通知',
    notificationDesc: '作为用户，您将收到我们的自动通知。如果您不希望收到任何通知，请通过点击取消选中该框。',
    changePassword: '修改密码',
    deleteAccount: '删除账户',
    logout: '退出登录',
    logoutSuccess: '您已成功退出登录',
    logoutError: '退出登录失败',
    accountDeleted: '您已安全退出',
    purchasedCollections: '已购买合集'
  },
  components: {
    addAICard: {
      createNewAIC: '创建新AI角色'
    },
    addRoleCard: {
      createNewRole: '创建新角色'
    },
    advertiseCard: {
      defaultTitle: '限时优惠',
      defaultSubtitle: '立即升级享受更多特权',
      defaultButton: '立即购买'
    },
    aiResultCard: {
      generateVideo: '生成视频',
      aiGeneratedImage: 'AI生成图片',
      imageLoading: '图片加载中...',
      imageLoadFailed: '图片加载失败',
      retry: '重试'
    },
    videoPlayer: {
      loading: '视频加载中...',
      error: '视频加载失败',
      retry: '重试',
      play: '播放',
      pause: '暂停',
      mute: '静音',
      unmute: '取消静音',
      quality: '清晰度',
      qualityAuto: '自动',
      fullscreen: '进入全屏',
      exitFullscreen: '退出全屏',
      scrub: '拖动视频进度条'
    },
    videoGenerationModal: {
      title: '生成视频',
      generateVideoNeeds: '生成视频需要',
      generateNow: '立即生成'
    },
    authForm: {
      signIn: '登录',
      register: '注册',
      email: '邮箱',
      password: '密码',
      confirmPassword: '确认密码',
      forgotPassword: '忘记密码？',
      createAccount: '创建',
      dontHaveAccount: '还没有账户？',
      alreadyHaveAccount: '已经有账户了？',
      signInHere: '登录',
      or: '或',
      google: 'Google',
      apple: 'Apple',
      verificationCode: '验证码',
      resendCode: '重新发送',
      resetPassword: '重置密码',
      newPassword: '新密码',
      confirmNewPassword: '确认新密码',
      backToLogin: '返回登录',
      passwordLengthError: '密码长度必须在6-16位之间',
      passwordMismatch: '两次输入的密码不一致',
      invalidEmail: '请输入有效的邮箱地址',
      pleaseFillAllFields: '请填写所有字段',
      pleaseEnterEmail: '请输入邮箱地址',
      pleaseEnterCode: '请输入完整的6位验证码',
      setNewPassword: '设置新密码',
      login: '登录',
      loggingIn: '登录中...',
      registering: '注册中...',
      registerFailed: '注册失败，请稍后重试',
      sendingCode: '发送中...',
      passwordResetSuccess: '密码重置成功',
      registrationSuccess: '注册成功',
      loginSuccess: '登录成功',
      secondsBeforeResend: '秒后重新发送',
      pleaseEnterPassword: '请输入密码',
      pleaseEnterNewPassword: '请输入新密码',
      pleaseConfirmNewPassword: '请确认新密码',
      fillNewPassword: '请填写您的新密码',
      codeSentTo: '验证码已发送至',
      codeSent: '验证码已发送',
      sendCode: '发送验证码',
      sending: '发送中...',
      verifying: '验证中...',
      verify: '验证',
      resetting: '重置中...',
      back: '返回',
      enterEmailForCode: '请输入您的邮箱地址，我们将发送验证码',
      verification: '验证',
      emailPlaceholder: '输入您的邮箱',
      passwordPlaceholder: '输入您的密码',
      confirmPasswordPlaceholder: '确认您的密码',
      verificationCodePlaceholder: '输入6位验证码',
      fillEmailAndPassword: '请填写邮箱和密码',
      fillAllFields: '请填写所有字段',
      enterEmail: '请输入您的邮箱地址',
      completeVerificationCode: '请输入完整的6位验证码',
      passwordLength: '密码长度必须在6-16位之间',
      resetSuccess: '密码重置成功！'
    },
    changePasswordModal: {
      title: '修改密码',
      currentPasswordPlaceholder: '当前密码',
      newPasswordPlaceholder: '新密码',
      confirmPasswordPlaceholder: '确认新密码',
      confirmChange: '确认修改',
      changing: '修改中...',
      passwordLengthError: '密码长度必须在8-16位之间',
      passwordLowercaseError: '密码必须包含至少一个小写字母',
      passwordNumberError: '密码必须包含至少一个数字',
      passwordSpecialCharError: '密码必须包含至少一个特殊字符',
      currentPasswordRequired: '请输入当前密码',
      newPasswordRequired: '请输入新密码',
      passwordMismatch: '两次输入的密码不一致',
      changeSuccess: '密码修改成功'
    },
    consumptionDetailModal: {
      title: '消费明细',
      overview: '总览',
      totalConsumption: '总消费',
      totalRecharge: '总充值',
      consumptionAmount: '消费金额',
      selectCategoryHint: '请选择项目查看消费明细',
      operationTime: '时间',
      period: '统计周期',
      noRecords: '暂无消费记录',
      noRecordsDescription: '您还没有任何消费记录',
      app: '应用',
      content: '内容',
      time: '时间',
      operationType: '操作类型',
      details: '详情',
      create: '创建',
      update: '更新',
      delete: '删除',
      use: '使用',
      fetchError: '获取消费明细失败',
      fetchOverviewError: '获取消费总览失败',
      loadingMore: '加载中...',
      noMoreData: '没有更多数据了',
      noCategories: '暂无消费分类',
      noCategoriesDescription: '当前没有任何消费分类数据',
      types: {
        textChat: '文字聊天',
        voiceChat: '语音聊天',
        imageGeneration: '图片生成',
        videoGeneration: '视频生成',
        subscription: '订阅会员',
        buyDiamonds: '购买钻石',
        checkIn: '签到',
        register: '注册',
        other: '其他',
        consumption: '消费',
        recharge: '充值',
        amount: '金额'
      }
    },
    consumptionModal: {
      insufficientBalance: '余额不足',
      goToBuy: '请前往购买钻石',
      buyDiamonds: '购买钻石'
    },
    createStep: {
      myAI: '我的AI',
      myAIDescription: '查看已创建的AI',
      createAI: '创建AI',
      createAIDescription: '创建新的AI角色',
      stepCountFormat: '{current}/{total}'
    }
  },
  error: {
    networkError: '网络连接错误',
    serverError: '服务器错误',
    unknownError: '未知错误',
    sessionExpired: '会话已过期，请重新登录',
    accessDenied: '访问被拒绝',
    notFound: '页面未找到'
  },
  premium: {
    premium: {
      monthlyDiamonds: '每月赠送 {amount} 个钻石（共 {total} 个）',
      voiceCall: '进行 AI 语音通话',
      createAIGirlfriend: '创建属于你自己的 AI 女友',
      unlimitedCommunication: '无限文字聊天',
      removeImageBlur: '去除图片模糊',
      generateImages: '生成图片',
      generateVideos: '生成视频',
      fastResponse: '极速响应速度',
      unlockPrivateVideos: '解锁私密视频',
      goToPro: '订阅Pro',
      getMonthly: '获取月度',
      freeTokens: '100个免费代币',
      pay: '支付',
      waitForPackage: '请等待套餐加载',
      selectPackage: '请选择Pro套餐',
      membershipPayment: 'Pro订阅支付',
      subscribe: '订阅',
      vipMembership: '个月Pro订阅',
      failedToLoadPrice: '加载Pro价格失败：',
      loading: '加载中...',
      noHiddenFees: '无隐藏费用',
      unsubscribe: '随时取消订阅',
      bankStatement: '您的银行对账单不会显示成人内容支付',
      noPackagesAvailable: '暂无套餐可选'
    },
    priceCard: {
      month: '月',
      months: '个月',
      perMonth: '/月',
      perMo: '月'
    },
    month: '月',
    purchaseDiamonds: {
      diamonds: '钻石',
      loading: '加载中...',
      pay: '支付',
      selectPackage: '请选择套餐',
      failedToLoadPrice: '加载代币价格失败：',
      pleaseSelectPackage: '请先选择套餐',
      diamondPayment: '钻石购买支付',
      purchase: '购买'
    }
  },
  header: {
    createAccount: '创建账户',
    login: '登录',
    profile: '个人中心',
    subscription: '订阅',
    logout: '退出',
    pro: 'PRO',
    maxDiscount: '最高75%折扣',
    buyDiamonds: '购买钻石',
    likeSuccess: '点赞成功',
    unlikeSuccess: '取消点赞成功',
    likeError: '点赞操作失败，请稍后重试'
  },
  notificationCenter: {
    title: '通知中心',
    noNotifications: '暂无通知',
    markAllAsRead: '全部标记为已读',
    clearAll: '清空所有',
    newNotification: '新通知',
    timeAgo: {
      justNow: '刚刚',
      minutesAgo: '{minutes}分钟前',
      hoursAgo: '{hours}小时前',
      daysAgo: '{days}天前',
      weeksAgo: '{weeks}周前',
      monthsAgo: '{months}个月前'
    }
  },
  paymentModal: {
    defaultTitle: '支付',
    creditCardPayment: '信用卡/借记卡支付',
    cryptoPayment: '使用加密货币',
    userSelectedCreditCard: '用户选择信用卡支付',
    userSelectedCrypto: '用户选择加密货币支付',
    proActivationSuccess: 'Pro开通成功',
    proActivationFailed: 'Pro开通失败',
    refreshUserInfoFailed: '刷新用户信息失败',
    selectPaymentMethod: '选择支付方式',
    payNow: '立即支付'
  },
  paymentCallback: {
    successVip: 'VIP订阅成功！',
    successTokens: '钻石充值成功！',
    pending: '订单支付处理中，已自动刷新账户信息，请稍后再查看',
    status: '订单状态: {status}',
    queryFailed: '查询订单失败'
  },
  profileModal: {
    title: '修改资料',
    namePlaceholder: '姓名',
    saveNotAvailable: '保存功能暂未开放'
  },
  roleCard: {
    unsupportedVideo: '您的浏览器不支持视频标签。',
    ageYears: '岁',
    likeOperationFailed: '点赞操作失败，请稍后重试'
  },
  sideBar: {
    myRole: '我的角色'
  },
  subscriptionModal: {
    title: '升级到Pro订阅',
    proBenefits: 'Pro订阅权益',
    monthlyDiamonds: '每月赠送 {amount} 个钻石（共 {total} 个）',
    voiceCall: '进行 AI 语音通话',
    createAI: '创建属于你自己的 AI 女友',
    unlimitedChat: '无限文字聊天',
    removeImageBlur: '去除图片模糊',
    generateImages: '生成图片',
    generateVideos: '生成视频',
    fastResponse: '极速响应速度',
    later: '稍后再说',
    upgradeNow: '立即订阅Pro',
    pay: '支付',
    loading: '加载中...',
    noPackagesAvailable: '暂无套餐可选'
  },
  diamondRechargeModal: {
    title: '余额不足',
    insufficientBalance: '钻石余额不足',
    needDiamonds: '需要更多钻石才能继续使用',
    tip: '充值钻石后可继续使用AI对话和生成功能',
    cancel: '取消',
    goRecharge: '去充值'
  },
  coupon: {
    title: '优惠券中心',
    subtitle: '领取优惠券，享受更多优惠',
    myCoupons: '我的优惠券',
    availableCoupons: '可领取',
    redeemCode: '兑换码',
    enterCode: '输入兑换码',
    redeem: '兑换',
    claim: '立即领取',
    useNow: '立即使用',
    save: '省',
    validUntil: '有效期至',
    unlimited: '不限量',
    remaining: '剩余',
    noCoupons: '暂无优惠券',
    noCouponsTitle: '暂无可用优惠券',
    noCouponsDesc: '请稍后再来看看，我们会定期更新优惠券',
    noMyCouponsTitle: '还没有优惠券',
    noMyCouponsDesc: '去可领取页面领取你的第一张优惠券吧',
    goClaim: '去领取',
    alreadyUsed: '已使用',
    alreadyExpired: '已过期',
    expiringSoon: '即将过期',
    availableList: '可领取的优惠券',
    coupons: '张优惠券',
    loading: '加载中...',
    claimSuccess: '领取成功',
    redeemSuccess: '兑换成功',
    applicableType: {
      vip: 'VIP订阅',
      token: '钻石充值',
      all: '全场通用'
    },
    status: {
      available: '可用',
      used: '已使用',
      expired: '已过期',
      cancelled: '已取消'
    },
    selectCoupon: '选择优惠券',
    noCoupon: '不使用优惠券',
    paymentSuccess: '订单已完成（优惠券全额抵扣）'
  },
  cookieConsent: {
    title: '我们使用 Cookie',
    description: '我们使用 Cookie 来提升您的体验。继续使用本网站即表示您同意我们的 Cookie 使用政策。',
    accept: '接受',
    decline: '拒绝'
  }
};
