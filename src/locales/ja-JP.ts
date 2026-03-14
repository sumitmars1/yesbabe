export default {
  time: {
    justNow: 'たった今',
    minutesAgo: '{n}分前',
    hoursAgo: '{n}時間前',
    daysAgo: '{n}日前',
    weeksAgo: '{n}週間前'
  },
  common: {
    confirm: '確認',
    cancel: 'キャンセル',
    save: '保存',
    delete: '削除',
    edit: '編集',
    add: '追加',
    search: '検索',
    reset: 'リセット',
    submit: '送信',
    back: '戻る',
    next: '次へ',
    prev: '前へ',
    loading: '読み込み中...',
    success: '成功しました',
    error: '失敗しました',
    warning: '警告',
    info: '情報',
    tips: 'ヒント',
    yes: 'はい',
    no: 'いいえ'
  },
  auth: {
    login: 'ログイン',
    register: '登録',
    logout: 'ログアウト',
    email: 'メールアドレス',
    password: 'パスワード',
    confirmPassword: 'パスワード（確認）',
    forgotPassword: 'パスワードをお忘れですか？',
    resetPassword: 'パスワードをリセット',
    verificationCode: '認証コード',
    sendCode: 'コードを送信',
    resendCode: '再送信',
    loginSuccess: 'ログインしました',
    registerSuccess: '登録しました',
    logoutSuccess: 'ログアウトしました',
    invalidCredentials: 'ユーザー名またはパスワードが正しくありません',
    emailRequired: 'メールアドレスを入力してください',
    passwordRequired: 'パスワードを入力してください',
    confirmPasswordRequired: 'パスワードを確認してください',
    passwordMismatch: 'パスワードが一致しません',
    verificationCodeRequired: '認証コードを入力してください',
    countdownText: '秒後に再送信'
  },
  menu: {
    home: 'ホーム',
    chat: 'チャット',
    generator: '画像生成',
    creator: 'クリエイター',
    premium: 'プレミアム',
    faq: 'よくある質問',
    settings: '設定',
    language: '言語',
    theme: 'テーマ',
    lightMode: 'ライトモード',
    darkMode: 'ダークモード',
    explore: '探索',
    create: 'AI作成',
    myAI: 'マイAI',
    aiGenerator: '画像生成',
    termsOfService: '利用規約',
    discount70: '70%OFF',
    discountPercentOff: '{percent}%OFF'
  },
  chat: {
    newChat: '新しいチャット',
    sendMessage: 'メッセージを送信',
    typing: '入力中...',
    messageHistory: 'メッセージ履歴',
    clearHistory: '履歴を消去',
    deleteChat: 'チャットを削除',
    renameChat: 'チャット名を変更',
    copyMessage: 'メッセージをコピー',
    regenerate: '再生成',
    startChat: 'チャットを始めましょう！',
    quickTip: '💡 ヒント：左側のリストからチャット相手を切り替えることができます',
    sayMessage: '何か話しかけてみてください',
    isReplying: 'AIが返信中です、少々お待ちください...',
    suggestedReplies: 'おすすめ返信',
    showMe: '写真を送って',
    sendMe: '動画を送って',
    canSee: '私に見えるのは',
    connectionStatus: {
      connected: '接続済み',
      connecting: '接続中',
      disconnected: '切断されました',
      unknown: '不明'
    },
    unknownOperation: '不明な操作：',
    searchPlaceholder: '連絡先を検索...',
    noMatchingRecords: '一致するチャット記録が見つかりません',
    noChatHistory: 'チャット記録はありません',
    tryOtherKeywords: '他のキーワードで検索してみてください',
    startFirstConversation: '最初の会話を始めましょう'
  },
  chatItem: {
    generatingReply: '返信を生成中...',
    generationError: '生成エラー：',
    regenerateError: '生成エラー、再生成してください',
    imageRequestDetected: '画像生成リクエストを検出しました、処理中...',
    generatingImage: '画像を生成中...',
    unknownError: '不明なエラーが発生しました',
    createAIVideo: 'AI動画を作成',
    generatingVideo: '動画を生成中',
    videoRequestSent: '動画生成リクエストを送信しました',
    maskedTitle: 'コンテンツは非表示です',
    maskedTextPlaceholder: 'Proにアップグレードして、プライベートテキストを解除',
    maskedImagePlaceholder: 'Proにアップグレードして、プライベート画像を解除',
    maskedVideoPlaceholder: 'Proにアップグレードして、プライベート動画を解除',
    upgradeToUnlock: '今すぐアップグレード',
    openPro: 'Proを開通',
    messageItemHiddenText: 'Proにアップグレードして、プライベートテキストを解除',
    messageItemHiddenImage: 'Proにアップグレードして、プライベート画像を解除',
    messageItemHiddenVideo: 'Proにアップグレードして、プライベート動画を解除',
    messageItemImage: '[画像]',
    messageItemVideo: '[動画]',
    messageItemCollection: '[コレクション]',
    messageItemImageCollection: '[画像コレクション]',
    messageItemVideoCollection: '[動画コレクション]',
    messageItemMarkAsReadError: '既読マークに失敗しました',
    messageItemSwitchToChat: 'チャット相手に切り替え',
    textToSpeech: 'テキスト読み上げ',
    generating: '生成中...',
    playing: '再生中',
    paused: '一時停止',
    ttsError: '音声生成に失敗しました',
    generatingContentWarning: 'コンテンツを生成中です。このページを離れると内容が失われますが、よろしいですか？',
    waitingInQueue: '待機中...'
  },
  collectionMessage: {
    price: '価格：{price}',
    images: '{count} 枚の画像',
    videos: '{count} 本の動画',
    buy: 'コレクションを購入',
    purchasing: '購入中...',
    purchaseFailed: '購入に失敗しました、後ほど再試行してください',
    purchased: '購入済み',
    assetsTitle: 'コレクション内容',
    empty: '表示できるファイルはありません',
    coverAlt: 'コレクションの表紙',
    defaultTitle: 'おすすめコレクション',
    viewAll: 'すべて見る',
    modalImages: '画像',
    modalVideos: '動画'
  },
  collection: {
    collections: 'コレクションリスト',
    collectionsOf: '{name}のコレクション',
    files: '個のファイル',
    filesCount: '個のファイル',
    purchase: '購入',
    confirmPurchase: '購入を確認',
    purchased: '人が購入済み',
    owned: '所有済み',
    view: '表示',
    noCollections: 'コレクションはありません',
    noFiles: 'ファイルはありません',
    loadError: 'コレクションリストの読み込みに失敗しました',
    loadFilesError: 'コレクションファイルの読み込みに失敗しました',
    purchaseSuccess: '購入しました',
    purchaseError: '購入に失敗しました',
    purchaseTimeout: '購入リクエストがタイムアウトしました、再試行してください',
    collectionFiles: 'コレクションファイル',
    noPurchasedCollections: '購入済みのコレクションはありません'
  },
  creator: {
    body: {
      selectBody: '体型を選択',
      selectBust: 'バストを選択',
      selectHip: 'ヒップを選択'
    },
    hair: {
      selectHairStyle: '髪型を選択',
      selectHairColor: '髪色を選択'
    },
    personality: {
      selectPersonality: '性格を選択'
    },
    race: {
      selectRace: '人種を選択',
      selectAge: '年齢を選択',
      eyeColor: '目の色'
    },
    relationship: {
      selectRelationship: '関係を選択'
    },
    style: {
      selectYourFavoriteStyle: '好きなスタイルを選択',
      loading: 'スタイルリストを読み込み中...'
    },
    creatorIndex: {
      prev: '前へ',
      next: '次へ'
    },
    create: '作成',
    creating: '作成中',
    loading: '読み込み中...'
  },
  createdModels: {
    noModels: 'AIモデルはまだ作成されていません',
    fetchFailed: '作成されたAIモデルの取得に失敗しました：',
    startChatting: 'チャットを始めましょう！',
    loading: 'モデルリストを読み込み中...'
  },
  profile: {
    userProfile: 'ユーザープロフィール',
    generateImage: '画像生成',
    voiceChat: 'ボイスチャット',
    aboutMe: '自己紹介',
    age: '年齢',
    language: '言語',
    relationship: '関係',
    ethnicity: '人種',
    hobby: '趣味',
    occupation: '職業',
    bodyType: '体型',
    personality: '性格'
  },
  generator: {
    title: '画像生成',
    prompt: 'プロンプト',
    generate: '生成',
    generating: '生成中...',
    download: 'ダウンロード',
    style: 'スタイル',
    size: 'サイズ',
    quality: '品質',
    generateImage: '画像生成',
    customizeStyle: '好きなスタイルでカスタマイズ',
    expand: '展開',
    collapse: '折りたたむ',
    generateImageCount: '生成枚数',
    generateButton: '画像生成',
    viewResults: '結果を見る',
    selectModel: '選択',
    cancel: 'キャンセル',
    confirm: '確認',
    noData: 'データなし',
    female: '女性',
    male: '男性',
    generationResults: '生成結果',
    noResults: '生成結果はありません',
    configureAndGenerate: '左側でパラメータを設定して画像を生成してください',
    generatedImage: '生成された画像',
    cost: '消費',
    vipRequired: 'Proサブスクリプションが必要です',
    vipRequiredDesc: 'この機能はProサブスクリプションのみ利用可能です。Proを購読してください',
    goToVip: '今すぐ購読',
    insufficientTokens: 'ダイヤモンド不足',
    insufficientTokensDesc: 'ダイヤモンドの残高が不足しています。チャージしてください',
    goToPurchase: '今すぐチャージ',
    result: {
      unfinishedTask: '未完了の生成タスクを検出しました',
      continueGenerating: '続ける',
      generatingMessage: '少々お待ちください、画像を生成しています。このページを離れても生成は継続されます。',
      allImagesCompleted: 'すべての画像が生成されました！結果を確認するか、新しい生成タスクを開始できます。',
      generationFailedMessage: '生成中に問題が発生しました。再試行するか、新しいタスクを開始してください。',
      findYourImages: 'ここで画像を確認できます。他のページが読み込み中でも、ページを離れたり新しいシリーズを開始したりできます。',
      generationFailed: '生成失敗',
      retry: '再試行',
      completedCount: '完了 {completed} / {total}',
      remainingCount: '残り {remaining}',
      allCompleted: 'すべて完了',
      totalImages: '計 {count} 枚',
      generating: '生成中...',
      completed: '完了',
      failed: '失敗',
      preparing: '準備中...',
      batchGeneration: '一括生成',
      generationProgress: '生成進捗',
      pagination: {
        totalImages: '計 {total} 枚',
        loading: '読み込み中...',
        pageSize: '件/ページ',
        jumpTo: '移動',
        page: 'ページ'
      },
      loading: '読み込み中...',
      restartGeneration: '生成を再開',
      noRetriableTask: '再試行可能なタスクはありません',
      retryFailed: '再試行に失敗しました、後ほどお試しください',
      imageGenerationFailed: '画像生成に失敗しました',
      imageGenerationCompleted: '画像生成が完了しました！',
      networkDisconnected: 'ネットワーク接続が切断されました',
      networkDisconnectedDesc: 'ネットワーク接続を確認してから再試行してください',
      fetchHistoryFailed: '履歴データの取得に失敗しました',
      refreshHistoryFailed: '画像履歴の更新に失敗しました',
      requestCanceled: '画像履歴リクエストがキャンセルされました（エラー無視）'
    }
  },
  myRoles: {
    title: 'マイキャラクター',
    noRoles: 'キャラクターはまだ作成されていません',
    loading: '読み込み中...'
  },
  deleteAccountModal: {
    title: 'アカウント削除',
    warning: '警告：この操作は取り消せません！',
    accountAssets: 'アカウントには {tokens} ダイヤモンドなどの資産が含まれています。削除すると復元できません。',
    reason: '削除理由',
    selectReason: '削除理由を選択してください',
    otherReason: 'その他の理由を入力してください',
    password: 'パスワードを入力してください',
    enterPassword: 'パスワードを入力してください',
    confirmation: '操作確認',
    enterConfirmation: "'DELETE MY ACCOUNT' と入力して確認してください",
    confirmDelete: '削除を確認',
    reasons: {
      notNeeded: '不要になった',
      featureLack: '機能がニーズに合わない',
      privacy: 'プライバシーの懸念',
      other: 'その他'
    },
    validation: {
      selectReason: '削除理由を選択してください',
      enterOtherReason: 'その他の理由を入力してください',
      enterPassword: 'パスワードを入力してください',
      enterConfirmation: "'DELETE MY ACCOUNT' と入力して確認してください",
      confirmationText: '正しい確認テキストを入力してください'
    },
    success: 'アカウントが削除されました',
    error: '削除に失敗しました、後ほど再試行してください'
  },
  faq: {
    title: 'Yesbabe AI <span class="faq-title-highlight">FAQ</span>',
    items: {
      whatIsYesbabeAI: {
        question: 'Yesbabe AI とは何ですか？',
        answer: 'Yesbabe.ai は最高のAIガールフレンドアプリです。パーソナライズされたバーチャルパートナーを作成したり、安全でプライベートな空間で、リアルなAIキャラクターと没入感のある無修正のファンタジー体験を即座に楽しむことができます。'
      },
      isYesbabeAILegitimate: {
        question: 'Yesbabe AI は合法的で安全に使用できますか？',
        answer: 'はい、Yesbabe AI は合法的なサービスです。暗号化された取引を採用し、GDPR準拠のデータプライバシー基準に従い、ユーザーの安全と機密性を確保するために慎重な請求方法を使用しています。'
      },
      bankStatements: {
        question: 'Yesbabe AI は銀行の明細書にどのように表示されますか？',
        answer: '取引は安全に処理され、中立的な加盟店名で表示されます。銀行の明細書には Yesbabe AI やそのサービスについては直接言及されないため、ユーザーのプライバシーが確保されます。'
      },
      customizeExperience: {
        question: 'Yesbabe AI の体験をカスタマイズできますか？',
        answer: 'はい、Yesbabe AI は強力なカスタマイズオプションを提供しています。ユーザーは「私のAIガールフレンドを作成」機能を通じて、人種、髪型、声、性格などの好みを選択し、独自のパートナーをデザインできます。'
      },
      whoUsesYesbabeAI: {
        question: '誰がどのような目的で Yesbabe AI を使用していますか？',
        answer: 'Yesbabe AI は幅広いユーザーに利用されています。仲間や感情的なサポートを求める人もいれば、ストーリーテリング、クリエイティブ・ライティング、ロールプレイに使用する人もいます。さらに、AI愛好家も対話型AIの能力をよりよく理解するために利用しています。'
      },
      whatIsAICompanion: {
        question: 'AIコンパニオンとは何ですか？自分で作成できますか？',
        answer: 'AIコンパニオンは、人工知能によって駆動されるバーチャルキャラクターで、会話したり、感情的なプロンプトに反応したり、継続的な対話を通じて進化したりします。Yesbabe AI を使用すると、ユーザーはコンパニオンの外見、行動、好みを完全にパーソナライズできます。'
      },
      multimodalInteraction: {
        question: 'AIコンパニオンは画像、動画、音声メッセージを送信できますか？',
        answer: 'はい、Yesbabe AI はマルチモーダル対話をサポートしています。コンパニオンは音声会話を行ったり、パーソナライズされた画像を生成したり、ユーザーの入力や好みに合わせてカスタマイズされたAI生成動画に登場したりすることができます。'
      },
      roleplay: {
        question: 'AIコンパニオンとロールプレイはできますか？',
        answer: 'もちろんです。Yesbabe AI は、カジュアルなやり取りや物語の展開から没入型のストーリーテリングまで、さまざまなロールプレイシナリオをサポートしています。AI はユーザーのプロンプトやテーマに基づいて動的に調整します。ただし、あなたは自分の誘導した会話に基づいて応答するAIキャラクターとチャットしていることに注意してください。ここでのやり取りはフィクションであり、自発的なものであり、https://yesbabe.ai/community-guidelines に従う必要があります。'
      },
      whatIsAIGirlfriend: {
        question: 'AIガールフレンドとは何ですか？どのように機能しますか？',
        answer: 'AIガールフレンドは、ディープラーニングと感情的知能によって駆動されるデジタルキャラクターで、有意義な方法であなたとチャットし、いちゃつき、つながるように設計されています。Yesbabe AI では、AIガールフレンドがあなたのスタイル、好み、気分に適応し、自然で感情的にリアルな個人的体験を作り出します。'
      },
      personalities: {
        question: '異なるAIガールフレンドの性格を選択できますか？',
        answer: 'はい、Yesbabe AI は、ユニークな性格、コミュニケーションスタイル、雰囲気を持つ、事前に構築されたAIガールフレンドキャラクターを多数提供しています。甘いタイプ、挑発的なタイプ、ささやくようなタイプ、大胆なタイプなど、あなたのエネルギーに合ったAIガールフレンドが見つかります。'
      },
      howAIGFLearns: {
        question: 'AIガールフレンドはどのように私を理解しますか？',
        answer: 'AIガールフレンドは会話を通じて学習します。話せば話すほど、彼女はあなたの好み、口調、興味を理解するようになります。時間の経過とともに、彼女は反応や行動を調整し、あなたのコミュニケーションスタイルによりよく一致させ、チャットをよりパーソナライズされたものにします。'
      },
      privacyAndSecurity: {
        question: 'AIガールフレンドとのチャットはプライベートで安全ですか？',
        answer: 'もちろんです。Yesbabe AI はエンドツーエンドの暗号化を使用して、すべてのAIガールフレンドとの会話の安全性と機密性を保持します。チャット履歴を完全に制御でき、追加のセキュリティのために二要素認証を有効にすることもできます。あなたのデータが共有または販売されることはありません。'
      },
      installation: {
        question: 'AIガールフレンドと話すために何かインストールする必要がありますか？',
        answer: 'インストールは不要です。デスクトップまたはモバイルデバイスから、いつでもどこでも Yesbabe AI 上のAIガールフレンドに直接アクセスできます。登録してAIガールフレンドを選択するだけで、すぐにチャットを開始できます。'
      }
    }
  },
  home: {
    filter: {
      newest: '最新',
      hottest: '人気',
      recommend: 'おすすめ'
    },
    noData: 'データなし',
    carousel: {
      title1: 'AIを作成',
      desc1: 'パーソナライズ',
      title2: '初回サブスクリプション',
      desc2: '最大{percent}オフ',
      title3: 'プライベートテーマ',
      desc3: '今すぐアンロック'
    }
  },
  infinityScroll: {
    loadMore: 'もっと読み込む',
    loadText: 'もっと読み込む',
    loading: '読み込み中...',
    loadingText: '履歴メッセージを読み込み中...',
    finished: '',
    noData: 'コンテンツなし'
  },
  mediaDisplay: {
    videoNotSupported: 'お使いのブラウザは動画タグをサポートしていません。'
  },
  modelCard: {
    videoNotSupported: 'お使いのブラウザは動画タグをサポートしていません。',
    age: '歳',
    liked: 'いいね済み',
    notLiked: 'いいね',
    latest: '最新'
  },
  messageQuotaModal: {
    title: '無料メッセージ回数がなくなりました',
    description: '無料メッセージ回数がなくなりました。Proを購読してより多くの特典をお楽しみください',
    proBenefitsTitle: 'Proサブスクリプション特典',
    benefits: {
      monthlyDiamonds: '毎月{amount}ダイヤモンド贈呈（合計{total}個）',
      voiceCall: 'AIリアルタイム音声通話',
      createPersonalizedAI: 'パーソナライズされたAIガールフレンドを作成',
      unlimitedChat: '無制限のテキストおよび音声交流',
      generateImages: '画像生成とプライベート動画のロック解除'
    },
    later: 'あとで',
    upgradeNow: '今すぐProを購読'
  },
  profilePage: {
    userProfile: 'ユーザープロフィール',
    modify: '修正',
    vipWelcome: 'Proへようこそ！',
    vipExpiration: 'Pro有効期限',
    subscribe: '購読',
    subscribePrice: '$4.99/月から',
    upgrade: '体験をアップグレード',
    myDiamonds: 'マイダイヤモンド',
    consumptionDetail: '消費明細',
    purchaseDiamonds: 'ダイヤを買う',
    allowNotifications: '通知を許可',
    notificationDesc: 'ユーザーとして、自動通知を受け取ります。通知を受け取りたくない場合は、チェックを外してください。',
    changePassword: 'パスワード変更',
    deleteAccount: 'アカウント削除',
    logout: 'ログアウト',
    logoutSuccess: 'ログアウトしました',
    logoutError: 'ログアウトに失敗しました',
    accountDeleted: '安全にログアウトしました',
    purchasedCollections: '購入済みコレクション'
  },
  components: {
    addAICard: {
      createNewAIC: '新しいAIキャラクターを作成'
    },
    addRoleCard: {
      createNewRole: '新しい役割を作成'
    },
    advertiseCard: {
      defaultTitle: '期間限定オファー',
      defaultSubtitle: '今すぐアップグレードして特典を楽しもう',
      defaultButton: '今すぐ購入'
    },
    aiResultCard: {
      generateVideo: '動画を生成',
      aiGeneratedImage: 'AI生成画像',
      imageLoading: '画像を読み込み中...',
      imageLoadFailed: '画像の読み込みに失敗しました',
      retry: '再試行'
    },
    videoPlayer: {
      loading: '動画を読み込み中...',
      error: '動画の読み込みに失敗しました',
      retry: '再試行',
      play: '再生',
      pause: '一時停止',
      mute: 'ミュート',
      unmute: 'ミュート解除',
      quality: '画質',
      qualityAuto: '自動',
      fullscreen: '全画面',
      exitFullscreen: '全画面終了',
      scrub: '動画の進行状況バーをドラッグ'
    },
    videoGenerationModal: {
      title: '動画を生成',
      generateVideoNeeds: '動画生成に必要なもの',
      generateNow: '今すぐ生成'
    },
    authForm: {
      signIn: 'ログイン',
      register: '登録',
      email: 'メールアドレス',
      password: 'パスワード',
      confirmPassword: 'パスワード（確認）',
      forgotPassword: 'パスワードをお忘れですか？',
      createAccount: '作成',
      dontHaveAccount: 'アカウントをお持ちでないですか？',
      alreadyHaveAccount: 'すでにアカウントをお持ちですか？',
      signInHere: 'ログイン',
      or: 'または',
      google: 'Google',
      apple: 'Apple',
      verificationCode: '認証コード',
      resendCode: '再送信',
      resetPassword: 'パスワードをリセット',
      newPassword: '新しいパスワード',
      confirmNewPassword: '新しいパスワード（確認）',
      backToLogin: 'ログインに戻る',
      passwordLengthError: 'パスワードの長さは6〜16文字である必要があります',
      passwordMismatch: 'パスワードが一致しません',
      invalidEmail: '有効なメールアドレスを入力してください',
      pleaseFillAllFields: 'すべてのフィールドに入力してください',
      pleaseEnterEmail: 'メールアドレスを入力してください',
      pleaseEnterCode: '6桁の認証コードを入力してください',
      setNewPassword: '新しいパスワードを設定',
      login: 'ログイン',
      loggingIn: 'ログイン中...',
      registering: '登録中...',
      registerFailed: '登録に失敗しました、後ほど再試行してください',
      sendingCode: '送信中...',
      passwordResetSuccess: 'パスワードのリセットに成功しました',
      registrationSuccess: '登録に成功しました',
      loginSuccess: 'ログインに成功しました',
      secondsBeforeResend: '秒後に再送信',
      pleaseEnterPassword: 'パスワードを入力してください',
      pleaseEnterNewPassword: '新しいパスワードを入力してください',
      pleaseConfirmNewPassword: '新しいパスワードを確認してください',
      fillNewPassword: '新しいパスワードを入力してください',
      codeSentTo: '認証コードを送信しました：',
      codeSent: '認証コード送信済み',
      sendCode: '認証コードを送信',
      sending: '送信中...',
      verifying: '検証中...',
      verify: '検証',
      resetting: 'リセット中...',
      back: '戻る',
      enterEmailForCode: 'メールアドレスを入力してください、認証コードを送信します',
      verification: '検証',
      emailPlaceholder: 'メールアドレスを入力',
      passwordPlaceholder: 'パスワードを入力',
      confirmPasswordPlaceholder: 'パスワードを確認',
      verificationCodePlaceholder: '6桁の認証コードを入力',
      fillEmailAndPassword: 'メールアドレスとパスワードを入力してください',
      fillAllFields: 'すべてのフィールドに入力してください',
      enterEmail: 'メールアドレスを入力してください',
      completeVerificationCode: '6桁の認証コードを入力してください',
      passwordLength: 'パスワードの長さは6〜16文字である必要があります',
      resetSuccess: 'パスワードのリセットに成功しました！'
    },
    changePasswordModal: {
      title: "パスワード変更",
      currentPasswordPlaceholder: "現在のパスワード",
      newPasswordPlaceholder: "新しいパスワード",
      confirmPasswordPlaceholder: "新しいパスワード（確認）",
      confirmChange: "変更を確認",
      changing: "変更中...",
      passwordLengthError: "パスワードは8〜16文字である必要があります",
      passwordLowercaseError: "パスワードには少なくとも1つの小文字を含める必要があります",
      passwordNumberError: "パスワードには少なくとも1つの数字を含める必要があります",
      passwordSpecialCharError: "パスワードには少なくとも1つの特殊文字を含める必要があります",
      currentPasswordRequired: "現在のパスワードを入力してください",
      newPasswordRequired: "新しいパスワードを入力してください",
      passwordMismatch: "パスワードが一致しません",
      changeSuccess: "パスワードが正常に変更されました"
    },
    consumptionDetailModal: {
      title: "消費明細",
      overview: "概要",
      totalConsumption: "総消費",
      totalRecharge: "総チャージ",
      consumptionAmount: "消費額",
      selectCategoryHint: "カテゴリを選択して詳細を表示",
      operationTime: "操作時間",
      period: "期間",
      noRecords: "消費記録はありません",
      noRecordsDescription: "消費記録はまだありません",
      app: "アプリ",
      content: "コンテンツ",
      time: "時間",
      operationType: "操作タイプ",
      details: "詳細",
      create: "作成",
      update: "更新",
      delete: "削除",
      use: "使用",
      fetchError: "消費詳細の取得に失敗しました",
      fetchOverviewError: "消費概要の取得に失敗しました",
      loadingMore: "読み込み中...",
      noMoreData: "これ以上データはありません",
      noCategories: "消費カテゴリなし",
      noCategoriesDescription: "利用可能な消費カテゴリはありません",
      types: {
        textChat: 'テキストチャット',
        voiceChat: 'ボイスチャット',
        imageGeneration: '画像生成',
        videoGeneration: '動画生成',
        subscription: 'サブスクリプション',
        buyDiamonds: 'ダイヤモンド購入',
        checkIn: 'チェックイン',
        register: '登録',
        other: 'その他',
        consumption: '消費',
        recharge: 'チャージ',
        amount: '金額'
      }
    },
    consumptionModal: {
      insufficientBalance: "残高不足",
      goToBuy: "ダイヤモンドを購入してください",
      buyDiamonds: "ダイヤモンドを購入"
    },
    createStep: {
      myAI: "マイAI",
      myAIDescription: "作成したAIを表示",
      createAI: "AI作成",
      createAIDescription: "新しいAIキャラクターを作成",
      stepCountFormat: "{current}/{total}"
    }
  },
  error: {
    networkError: 'ネットワーク接続エラー',
    serverError: 'サーバーエラー',
    unknownError: '不明なエラー',
    sessionExpired: 'セッションが期限切れです。再度ログインしてください',
    accessDenied: 'アクセスが拒否されました',
    notFound: 'ページが見つかりません'
  },
  premium: {
    premium: {
      monthlyDiamonds: '毎月{amount}ダイヤを付与（合計{total}個）',
      voiceCall: 'AI音声通話',
      createAIGirlfriend: '自分だけのAI彼女を作成',
      unlimitedCommunication: 'テキストチャット無制限',
      removeImageBlur: '画像のぼかしを除去',
      generateImages: '画像生成',
      generateVideos: '動画生成',
      fastResponse: '超高速レスポンス',
      unlockPrivateVideos: 'プライベート動画のロック解除',
      goToPro: 'Proへ',
      getMonthly: '月額プラン',
      freeTokens: '毎月100無料トークン',
      pay: '支払う',
      waitForPackage: 'パッケージの読み込みをお待ちください',
      selectPackage: 'Proパッケージを選択してください',
      membershipPayment: 'メンバーシップ購読の支払い',
      subscribe: '購読',
      vipMembership: 'ヶ月Proメンバーシップ',
      failedToLoadPrice: 'Pro価格の読み込みに失敗しました：',
      loading: '読み込み中...',
      noHiddenFees: '隠し料金なし',
      unsubscribe: 'いつでも解約可能',
      bankStatement: '銀行明細にはアダルトコンテンツの支払いは表示されません',
      noPackagesAvailable: '利用可能なパッケージはありません'
    },
    priceCard: {
      month: '月',
      months: 'ヶ月',
      perMonth: '/月',
      perMo: '月'
    },
    month: '月',
    purchaseDiamonds: {
      diamonds: 'ダイヤモンド',
      loading: '読み込み中...',
      pay: '支払う',
      selectPackage: 'パッケージを選択してください',
      failedToLoadPrice: 'トークン価格の読み込みに失敗しました：',
      pleaseSelectPackage: '先にパッケージを選択してください',
      diamondPayment: 'ダイヤモンド購入の支払い',
      purchase: '購入'
    }
  },
  header: {
    createAccount: '登録',
    login: 'ログイン',
    profile: 'プロフィール',
    subscription: 'サブスクリプション',
    logout: 'ログアウト',
    pro: 'PRO',
    maxDiscount: '最大75％オフ',
    buyDiamonds: 'ダイヤモンドを購入',
    likeSuccess: 'いいねしました',
    unlikeSuccess: 'いいねを取り消しました',
    likeError: 'いいね操作に失敗しました。後ほど再試行してください'
  },
  notificationCenter: {
    title: '通知センター',
    noNotifications: '通知なし',
    markAllAsRead: 'すべて既読にする',
    clearAll: 'すべて消去',
    newNotification: '新しい通知',
    timeAgo: {
      justNow: 'たった今',
      minutesAgo: '{minutes}分前',
      hoursAgo: '{hours}時間前',
      daysAgo: '{days}日前',
      weeksAgo: '{weeks}週間前',
      monthsAgo: '{months}ヶ月前'
    }
  },
  paymentModal: {
    defaultTitle: '支払い',
    creditCardPayment: 'カード支払い',
    cryptoPayment: '暗号資産支払い',
    userSelectedCreditCard: 'ユーザーがクレジットカード支払いを選択しました',
    userSelectedCrypto: 'ユーザーが暗号資産支払いを選択しました',
    proActivationSuccess: 'Proのアクティベーションに成功しました',
    proActivationFailed: 'Proのアクティベーションに失敗しました',
    refreshUserInfoFailed: 'ユーザー情報の更新に失敗しました',
    selectPaymentMethod: '支払い方法を選択',
    pleaseSelectPaymentMethod: '支払い方法を選択してください。',
    pleaseSelectOnlyOnePaymentMethod: '支払い方法は1つだけ選択してください。',
    payNow: '今すぐ支払う'
  },
  paymentCallback: {
    successVip: 'VIP購読が完了しました！',
    successTokens: 'ダイヤのチャージが完了しました！',
    pending: '支払い処理中です。アカウントを更新しました。しばらくしてからご確認ください。',
    status: '注文状況: {status}',
    queryFailed: '注文の確認に失敗しました'
  },
  profileModal: {
    title: 'プロフィール修正',
    namePlaceholder: '名前',
    saveNotAvailable: '保存機能はまだ利用できません'
  },
  roleCard: {
    unsupportedVideo: 'お使いのブラウザは動画タグをサポートしていません。',
    ageYears: '歳',
    likeOperationFailed: 'いいね操作に失敗しました。後ほど再試行してください'
  },
  sideBar: {
    myRole: 'マイキャラクター'
  },
  subscriptionModal: {
    title: 'Proにアップグレード',
    proBenefits: 'Proサブスクリプション特典',
    monthlyDiamonds: '毎月{amount}ダイヤを付与（合計{total}個）',
    voiceCall: 'AI音声通話',
    createAI: 'あなた専属のAIを作成',
    unlimitedChat: 'テキストチャット無制限',
    removeImageBlur: '画像のぼかしを除去',
    generateImages: '画像生成',
    generateVideos: '動画生成',
    generateImagesAndVideos: '高画質画像と動画を生成',
    unlockPrivateThemes: 'プライベートテーマコレクションを解除',
    fastResponse: '超高速レスポンス',
    later: 'あとで',
    upgradeNow: '今すぐProにアップグレード',
    pay: '支払う',
    loading: '読み込み中...',
    noPackagesAvailable: '利用可能なパッケージはありません'
  },
  diamondRechargeModal: {
    title: '残高不足',
    insufficientBalance: 'ダイヤモンド残高不足',
    needDiamonds: '続けるにはダイヤモンドが必要です',
    tip: 'AIチャットや生成機能を使い続けるためにダイヤモンドをチャージしてください',
    cancel: 'キャンセル',
    goRecharge: '今すぐチャージ'
  },
  coupon: {
    title: 'クーポンセンター',
    subtitle: 'クーポンを受け取って、お得にお買い物',
    myCoupons: 'マイクーポン',
    availableCoupons: '入手可能',
    redeemCode: '引き替えコード',
    enterCode: 'コードを入力',
    redeem: '引き替え',
    claim: '受け取る',
    useNow: '今すぐ使う',
    save: '節約',
    validUntil: '有効期限',
    unlimited: '無限',
    remaining: '残り',
    noCoupons: 'クーポンがありません',
    noCouponsTitle: '利用可能なクーポンはありません',
    noCouponsDesc: '新しいクーポンが追加されたら、またチェックしてください',
    noMyCouponsTitle: 'まだクーポンがありません',
    noMyCouponsDesc: '「入手可能」タブから最初のクーポンを受け取りましょう',
    goClaim: 'クーポンを受け取る',
    alreadyUsed: '使用済み',
    alreadyExpired: '期限切れ',
    expiringSoon: 'まもなく期限切れ',
    availableList: '利用可能なクーポン',
    coupons: '件のクーポン',
    loading: '読み込み中...',
    claimSuccess: 'クーポンを受け取りました',
    redeemSuccess: 'クーポンを引き替えました',
    applicableType: {
      vip: 'VIP会員',
      token: 'ダイヤ 충전',
      all: '全商品'
    },
    status: {
      available: '利用可能',
      used: '使用済み',
      expired: '期限切れ',
      cancelled: 'キャンセル済み'
    },
    selectCoupon: 'クーポンを選択',
    noCoupon: 'クーポンを使わない',
    paymentSuccess: '注文完了（クーポン適用済み）'
  },
  cookieConsent: {
    title: 'Cookieを使用しています',
    description: 'お客様の体験を向上させるためにCookieを使用しています。このウェブサイトを継続して使用することにより、Cookieポリシーに同意したものとみなされます。',
    accept: '同意する',
    decline: '拒否する'
  }
};
