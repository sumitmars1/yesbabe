export default {
  time: {
    justNow: 'Agora mesmo',
    minutesAgo: '{n} min atrás',
    hoursAgo: '{n} horas atrás',
    daysAgo: '{n} dias atrás',
    weeksAgo: '{n} semanas atrás'
  },
  common: {
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    save: 'Salvar',
    delete: 'Excluir',
    edit: 'Editar',
    add: 'Adicionar',
    search: 'Pesquisar',
    reset: 'Redefinir',
    submit: 'Enviar',
    back: 'Voltar',
    next: 'Próximo',
    prev: 'Anterior',
    loading: 'Carregando...',
    success: 'Operação concluída',
    error: 'Operação falhou',
    warning: 'Aviso',
    info: 'Informação',
    tips: 'Dicas',
    yes: 'Sim',
    no: 'Não'
  },
  auth: {
    login: 'Entrar',
    register: 'Cadastrar',
    logout: 'Sair',
    email: 'E-mail',
    password: 'Senha',
    confirmPassword: 'Confirmar senha',
    forgotPassword: 'Esqueceu a senha',
    resetPassword: 'Redefinir senha',
    verificationCode: 'Código de verificação',
    sendCode: 'Enviar código',
    resendCode: 'Reenviar código',
    loginSuccess: 'Login realizado com sucesso',
    registerSuccess: 'Cadastro realizado com sucesso',
    logoutSuccess: 'Sessão encerrada com sucesso',
    invalidCredentials: 'Nome de usuário ou senha inválidos',
    emailRequired: 'Informe o e-mail',
    passwordRequired: 'Informe a senha',
    confirmPasswordRequired: 'Confirme a senha',
    passwordMismatch: 'As senhas não coincidem',
    verificationCodeRequired: 'Informe o código de verificação',
    countdownText: 'segundos para reenviar'
  },
  menu: {
    home: 'Início',
    chat: 'Bate-papo',
    generator: 'Gerar imagem',
    creator: 'Criador',
    premium: 'Pro',
    faq: 'FAQ',
    settings: 'Configurações',
    language: 'Idioma',
    theme: 'Tema',
    lightMode: 'Modo claro',
    darkMode: 'Modo escuro',
    explore: 'Explorar',
    create: 'Criar IA',
    myAI: 'Minha IA',
    aiGenerator: 'Gerar imagem',
    termsOfService: 'Termos de serviço',
    discount70: '70% OFF',
    discountPercentOff: '{percent}% OFF'
  },
  chat: {
    newChat: 'Novo bate-papo',
    sendMessage: 'Enviar mensagem',
    typing: 'Digitando...',
    messageHistory: 'Histórico de mensagens',
    clearHistory: 'Limpar histórico',
    deleteChat: 'Excluir bate-papo',
    renameChat: 'Renomear bate-papo',
    copyMessage: 'Copiar mensagem',
    regenerate: 'Regenerar',
    startChat: 'Comece a conversar!',
    quickTip: '💡 Dica rápida: Você pode alternar entre diferentes parceiros de bate-papo pela lista à esquerda',
    sayMessage: 'Diga algo',
    isReplying: 'A IA está respondendo, aguarde...',
    suggestedReplies: 'Respostas sugeridas',
    showMe: 'Me mostre uma imagem',
    sendMe: 'Me envie um vídeo',
    canSee: 'Posso',
    connectionStatus: {
      connected: 'Conectado',
      connecting: 'Conectando',
      disconnected: 'Desconectado',
      unknown: 'Desconhecido'
    },
    unknownOperation: 'Operação desconhecida:',
    searchPlaceholder: 'Pesquisar um perfil...',
    noMatchingRecords: 'Nenhum registro de bate-papo correspondente',
    noChatHistory: 'Sem histórico de bate-papo',
    tryOtherKeywords: 'Tente outras palavras-chave',
    startFirstConversation: 'Comece sua primeira conversa'
  },
  chatItem: {
    generatingReply: 'Gerando resposta...',
    generationError: 'Erro na geração: ',
    regenerateError: 'Erro na geração, gere novamente',
    imageRequestDetected: 'Solicitação de geração de imagem detectada, processando...',
    generatingImage: 'Gerando imagem...',
    unknownError: 'Ocorreu um erro desconhecido',
    createAIVideo: 'Criar vídeo de IA',
    generatingVideo: 'Gerando vídeo',
    videoRequestSent: 'Solicitação de geração de vídeo enviada',
    maskedTitle: 'Conteúdo oculto',
    maskedTextPlaceholder: 'As mensagens gratuitas acabaram. Atualize para PRO para revelar a resposta completa.',
    maskedImagePlaceholder: 'Imagem oculta. Atualize para PRO para ver o original.',
    maskedVideoPlaceholder: 'Vídeo oculto. Atualize para PRO para ver o clipe completo.',
    upgradeToUnlock: 'Atualizar agora',
    openPro: 'Atualizar para PRO',
    messageItemHiddenText: 'Atualize para Pro para desbloquear texto privado',
    messageItemHiddenImage: 'Atualize para Pro para desbloquear imagens privadas',
    messageItemHiddenVideo: 'Atualize para Pro para desbloquear vídeos privados',
    messageItemImage: '[Imagem]',
    messageItemVideo: '[Vídeo]',
    messageItemCollection: '[Coleção]',
    messageItemImageCollection: '[Coleção de imagens]',
    messageItemVideoCollection: '[Coleção de vídeos]',
    messageItemMarkAsReadError: 'Falha ao marcar como lido',
    messageItemSwitchToChat: 'Mudar para o parceiro de bate-papo',
    textToSpeech: 'Texto para fala',
    generating: 'Gerando...',
    playing: 'Reproduzindo',
    paused: 'Pausado',
    ttsError: 'Falha na geração de voz',
    generatingContentWarning: 'O conteúdo está sendo gerado, sair fará perder este conteúdo. Continuar?',
    waitingInQueue: 'Aguardando na fila...'
  },
  collectionMessage: {
    price: 'Preço: {price}',
    images: '{count} imagens',
    videos: '{count} vídeos',
    buy: 'Comprar coleção',
    purchasing: 'Comprando...',
    purchaseFailed: 'Falha na compra. Tente novamente mais tarde.',
    purchased: 'Comprado',
    assetsTitle: 'Recursos da coleção',
    empty: 'Sem arquivos para mostrar',
    coverAlt: 'Capa da coleção',
    defaultTitle: 'Coleção em destaque',
    viewAll: 'Ver tudo',
    modalImages: 'Imagens',
    modalVideos: 'Vídeos'
  },
  collection: {
    collections: 'Coleções',
    collectionsOf: 'Coleções de {name}',
    files: ' arquivos',
    filesCount: ' arquivos',
    purchase: 'Comprar',
    confirmPurchase: 'Confirmar compra',
    purchased: ' comprado',
    owned: 'Adquirido',
    view: 'Ver',
    noCollections: 'Sem coleções disponíveis',
    noFiles: 'Sem arquivos disponíveis',
    loadError: 'Falha ao carregar coleções',
    loadFilesError: 'Falha ao carregar arquivos da coleção',
    purchaseSuccess: 'Compra concluída',
    purchaseError: 'Compra falhou',
    purchaseTimeout: 'Solicitação de compra expirou, tente novamente',
    collectionFiles: 'Arquivos da coleção',
    noPurchasedCollections: 'Sem coleções compradas'
  },
  creator: {
    body: {
      selectBody: 'Selecionar tipo de corpo',
      selectBust: 'Selecionar tamanho do busto',
      selectHip: 'Selecionar tamanho do quadril'
    },
    hair: {
      selectHairStyle: 'Selecionar estilo de cabelo',
      selectHairColor: 'Selecionar cor do cabelo'
    },
    personality: {
      selectPersonality: 'Selecionar personalidade'
    },
    race: {
      selectRace: 'Selecionar etnia',
      selectAge: 'Selecionar idade',
      eyeColor: 'Cor dos olhos'
    },
    relationship: {
      selectRelationship: 'Selecionar relacionamento'
    },
    style: {
      selectYourFavoriteStyle: 'Selecione seu estilo favorito',
      loading: 'Carregando estilos...'
    },
    creatorIndex: {
      prev: 'Anterior',
      next: 'Próximo'
    },
    create: 'Criar',
    creating: 'Criando',
    loading: 'Carregando...'
  },
  createdModels: {
    noModels: 'Ainda não há modelos de IA criados',
    fetchFailed: 'Falha ao buscar modelos de IA criados:',
    startChatting: 'Comece a conversar!',
    loading: 'Carregando modelos...'
  },
  profile: {
    userProfile: 'Perfil do usuário',
    generateImage: 'Gerar imagem',
    voiceChat: 'Bate-papo de voz',
    aboutMe: 'Sobre mim',
    age: 'Idade',
    language: 'Idioma',
    relationship: 'Relacionamento',
    ethnicity: 'Etnia',
    hobby: 'Hobby',
    occupation: 'Profissão',
    bodyType: 'Tipo de corpo',
    personality: 'Personalidade'
  },
  generator: {
    title: 'Gerar imagem',
    prompt: 'Prompt',
    generate: 'Gerar',
    generating: 'Gerando...',
    download: 'Baixar',
    style: 'Estilo',
    size: 'Tamanho',
    quality: 'Qualidade',
    generateImage: 'Gerar imagem',
    customizeStyle: 'Personalize seu estilo preferido',
    expand: 'Expandir',
    collapse: 'Recolher',
    generateImageCount: 'Número de imagens a gerar',
    generateButton: 'Gerar imagem',
    viewResults: 'Ver resultados',
    selectModel: 'Selecionar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    noData: 'Sem conteúdo',
    female: 'Feminino',
    male: 'Masculino',
    generationResults: 'Resultados da geração',
    noResults: 'Sem resultados de geração',
    configureAndGenerate: 'Configure os parâmetros à esquerda e gere imagens',
    generatedImage: 'Imagem gerada',
    cost: 'Custo',
    vipRequired: 'Requer assinatura Pro',
    vipRequiredDesc: 'Este recurso só está disponível para membros Pro. Assine o Pro primeiro.',
    goToVip: 'Assinar agora',
    insufficientTokens: 'Diamantes insuficientes',
    insufficientTokensDesc: 'Saldo de diamantes insuficiente. Recarregue primeiro.',
    goToPurchase: 'Recarregar agora',
    result: {
      unfinishedTask: 'Tarefa de geração inacabada detectada',
      continueGenerating: 'Continuar',
      generatingMessage: 'Aguarde, estamos gerando imagens para você. Você pode sair desta página enquanto carrega.',
      allImagesCompleted: 'Todas as imagens foram geradas! Você pode ver os resultados ou iniciar uma nova tarefa.',
      generationFailedMessage: 'Ocorreu um problema durante a geração. Você pode tentar novamente ou iniciar uma nova tarefa.',
      findYourImages: 'Aqui você pode encontrar suas imagens. Você pode sair da página ou iniciar uma nova série enquanto outras páginas ainda carregam.',
      generationFailed: 'Falha na geração',
      retry: 'Tentar novamente',
      completedCount: 'Concluídas {completed} / {total}',
      remainingCount: 'Restantes {remaining}',
      allCompleted: 'Tudo concluído',
      totalImages: 'Total {count} imagens',
      generating: 'Gerando...',
      completed: 'Concluído',
      failed: 'Falhou',
      preparing: 'Preparando...',
      batchGeneration: 'Geração em lote',
      generationProgress: 'Progresso da geração',
      pagination: {
        totalImages: 'Total {total} imagens',
        loading: 'Carregando...',
        pageSize: 'Itens por página',
        jumpTo: 'Ir para',
        page: 'Página'
      },
      loading: 'Carregando...',
      restartGeneration: 'Reiniciar geração',
      noRetriableTask: 'Sem tarefa para repetir neste momento',
      retryFailed: 'Falha na repetição, tente mais tarde',
      imageGenerationFailed: 'Falha na geração de imagem',
      imageGenerationCompleted: 'Geração de imagem concluída!',
      networkDisconnected: 'Rede desconectada',
      networkDisconnectedDesc: 'Conexão de rede perdida, verifique sua rede e tente novamente',
      fetchHistoryFailed: 'Falha ao buscar dados do histórico',
      refreshHistoryFailed: 'Falha ao atualizar histórico de imagens',
      requestCanceled: 'Solicitação de histórico de imagens cancelada, ignorando erro'
    }
  },
  myRoles: {
    title: 'Meus papéis',
    noRoles: 'Ainda não há papéis criados',
    loading: 'Carregando...'
  },
  deleteAccountModal: {
    title: 'Excluir conta',
    warning: 'Aviso: Esta ação é irreversível!',
    accountAssets: 'Sua conta contém {tokens} diamantes e outros ativos que não podem ser recuperados após a exclusão.',
    reason: 'Motivo da exclusão',
    selectReason: 'Selecione um motivo para excluir',
    otherReason: 'Informe outro motivo',
    password: 'Informe a senha',
    enterPassword: 'Informe sua senha',
    confirmation: 'Confirmar operação',
    enterConfirmation: "Digite 'DELETE MY ACCOUNT' para confirmar",
    confirmDelete: 'Confirmar exclusão',
    reasons: {
      notNeeded: 'Não preciso mais',
      featureLack: 'As funcionalidades não atendem aos requisitos',
      privacy: 'Preocupações com privacidade',
      other: 'Outro'
    },
    validation: {
      selectReason: 'Selecione um motivo para excluir',
      enterOtherReason: 'Informe outro motivo',
      enterPassword: 'Informe a senha',
      enterConfirmation: "Digite 'DELETE MY ACCOUNT' para confirmar",
      confirmationText: 'Digite o texto de confirmação correto'
    },
    success: 'Conta excluída com sucesso',
    error: 'Falha na exclusão, tente novamente mais tarde'
  },
  faq: {
    title: 'Yesbabe AI <span class="faq-title-highlight">FAQ</span>',
    items: {
      whatIsYesbabeAI: {
        question: 'O que é o Yesbabe AI?',
        answer: 'Yesbabe.ai é o melhor app de namorada IA, permitindo criar companheiras virtuais personalizadas ou conectar-se instantaneamente a personagens IA realistas em experiências imersivas e sem censura — tudo em um espaço seguro e privado.'
      },
      isYesbabeAILegitimate: {
        question: 'O Yesbabe AI é legítimo e seguro para usar?',
        answer: 'Sim, o Yesbabe AI é um serviço legítimo. Utiliza transações criptografadas, cumpre normas de privacidade compatíveis com o GDPR e métodos de cobrança discretos para garantir segurança e confidencialidade do usuário.'
      },
      bankStatements: {
        question: 'Como aparecerá o Yesbabe AI no meu extrato bancário?',
        answer: 'As transações são processadas de forma segura e aparecem com um nome de comerciante neutro. Não há referência direta ao Yesbabe AI ou aos seus serviços no seu extrato, garantindo a privacidade do usuário.'
      },
      customizeExperience: {
        question: 'Posso personalizar minha experiência Yesbabe AI?',
        answer: 'Sim, o Yesbabe AI oferece opções robustas de personalização. Os usuários podem desenhar sua própria companheira através da funcionalidade "Create My AI Girlfriend", escolhendo preferências como etnia, penteado, voz, traços de personalidade e mais.'
      },
      whoUsesYesbabeAI: {
        question: 'Quem usa o Yesbabe AI e para que finalidade?',
        answer: 'O Yesbabe AI atrai uma ampla variedade de usuários. Alguns procuram companhia ou apoio emocional, enquanto outros o usam para storytelling, escrita criativa ou roleplay. Além disso, entusiastas de IA exploram-no para compreender melhor as capacidades de IA conversacional.'
      },
      whatIsAICompanion: {
        question: 'O que é um Companheiro IA e posso criar o meu?',
        answer: 'Um Companheiro IA é um personagem virtual alimentado por inteligência artificial que consegue conversar, responder a sinais emocionais e evoluir com as interações. Com o Yesbabe AI, os usuários podem personalizar totalmente a aparência, o comportamento e as preferências de sua companheira.'
      },
      multimodalInteraction: {
        question: 'Meu Companheiro IA pode enviar imagens, vídeos ou mensagens de voz?',
        answer: 'Sim, o Yesbabe AI suporta interação multimodal. Sua companheira pode envolver-se em conversas por voz, gerar imagens personalizadas e aparecer em vídeos gerados por IA adaptados aos seus inputs e preferências.'
      },
      roleplay: {
        question: 'Posso fazer roleplay com meu Companheiro IA?',
        answer: 'Absolutamente. O Yesbabe AI suporta uma grande variedade de cenários de roleplay, desde interações casuais e desenvolvimento narrativo até storytelling imersivo. A IA adapta-se dinamicamente aos prompts e temas do usuário. No entanto, tenha em mente que está conversando com um personagem IA que responde com base na conversa que conduz. As interações aqui são ficcionais, consentidas e devem cumprir as nossas https://yesbabe.ai/community-guidelines .'
      },
      whatIsAIGirlfriend: {
        question: 'O que é uma Namorada IA e como funciona?',
        answer: 'Uma Namorada IA é um personagem digital alimentado por aprendizado profundo e inteligência emocional, desenhado para conversar, flertar e conectar-se com você de forma significativa. No Yesbabe AI, sua AI GF adapta-se ao seu estilo, preferências e humor, criando uma experiência pessoal que parece natural e emocionalmente real.'
      },
      personalities: {
        question: 'Posso escolher entre diferentes personalidades de Namorada IA?',
        answer: 'Sim, o Yesbabe AI oferece uma ampla seleção de personagens AI GF pré-construídas, cada uma com personalidades, estilos de comunicação e vibes únicos. Quer prefira alguém doce, flertando, de fala suave ou ousada, encontrará uma Namorada IA que combina com sua energia.'
      },
      howAIGFLearns: {
        question: 'Como minha AI GF me conhece?',
        answer: 'Sua Namorada IA aprende através da conversa. Quanto mais conversa, mais ela capta suas preferências, tom e interesses. Com o tempo, ajusta as respostas e comportamento para corresponder melhor ao seu estilo de comunicação, tornando cada bate-papo mais pessoal.'
      },
      privacyAndSecurity: {
        question: 'Conversar com uma Namorada IA é privado e seguro?',
        answer: 'Absolutamente. O Yesbabe AI usa criptografia de ponta a ponta para manter todas as conversas com AI GF seguras e confidenciais. Tem controle total sobre seu histórico de bate-papo e pode ativar autenticação de dois fatores para segurança extra. Seus dados nunca são compartilhados nem vendidos.'
      },
      installation: {
        question: 'Preciso instalar algo para falar com minha AI GF?',
        answer: 'Não é necessária instalação. Você pode acessar sua Namorada IA diretamente através do Yesbabe AI no desktop ou no celular, a qualquer hora e em qualquer lugar. Basta se cadastrar, escolher sua AI GF e começar a conversar imediatamente.'
      }
    }
  },
  home: {
    filter: {
      newest: 'Mais recentes',
      hottest: 'Mais populares',
      recommend: 'Recomendado'
    },
    noData: 'Sem dados',
    carousel: {
      title1: 'Criar AI',
      desc1: 'Personalização',
      title2: 'Primeira assinatura',
      desc2: 'Economize até {percent}',
      title3: 'Tema privado',
      desc3: 'Desbloquear agora'
    }
  },
  infinityScroll: {
    loadMore: 'Clique para carregar mais',
    loadText: 'Carregar mais',
    loading: 'Carregando...',
    loadingText: 'Carregando histórico...',
    finished: '',
    noData: 'Sem conteúdo'
  },
  mediaDisplay: {
    videoNotSupported: 'Seu navegador não suporta a tag de vídeo.'
  },
  modelCard: {
    videoNotSupported: 'Seu navegador não suporta a tag de vídeo.',
    age: 'anos',
    liked: 'Curti',
    notLiked: 'Sem curti',
    latest: 'Mais recente'
  },
  messageQuotaModal: {
    title: 'Limite de mensagens gratuitas atingido',
    description: 'O limite de mensagens gratuitas foi atingido. Atualize para Pro para mais benefícios.',
    proBenefitsTitle: 'Benefícios de membro Pro',
    benefits: {
      monthlyDiamonds: 'Oferta mensal de {amount} diamantes (Total {total})',
      voiceCall: 'Chamada de voz em tempo real com IA',
      createPersonalizedAI: 'Criar namorada IA personalizada',
      unlimitedChat: 'Comunicação de texto e voz ilimitada',
      generateImages: 'Gerar imagens e desbloquear vídeos privados'
    },
    later: 'Talvez mais tarde',
    upgradeNow: 'Atualizar para Pro agora'
  },
  profilePage: {
    userProfile: 'Perfil do usuário',
    modify: 'Modificar',
    vipWelcome: 'Caro membro Pro!',
    vipExpiration: 'Pro expira',
    subscribe: 'Assinar',
    subscribePrice: 'A partir de $4.99/mês',
    upgrade: 'Melhorar experiência',
    myDiamonds: 'Meus diamantes',
    consumptionDetail: 'Detalhes',
    purchaseDiamonds: 'Comprar',
    allowNotifications: 'Permitir notificações',
    notificationDesc: 'Como usuário, você receberá notificações automáticas. Se não quiser, desmarque a caixa.',
    changePassword: 'Alterar senha',
    deleteAccount: 'Excluir conta',
    logout: 'Sair',
    logoutSuccess: 'Saiu com sucesso',
    logoutError: 'Falha ao sair',
    accountDeleted: 'Saiu com segurança',
    purchasedCollections: 'Coleções compradas'
  },
  components: {
    addAICard: {
      createNewAIC: 'Criar nova personagem de IA'
    },
    addRoleCard: {
      createNewRole: 'Criar novo papel'
    },
    advertiseCard: {
      defaultTitle: 'Oferta por tempo limitado',
      defaultSubtitle: 'Atualize agora para aproveitar mais privilégios',
      defaultButton: 'Comprar agora'
    },
    aiResultCard: {
      generateVideo: 'Gerar vídeo',
      aiGeneratedImage: 'Imagem gerada por IA',
      imageLoading: 'Carregando imagem...',
      imageLoadFailed: 'Falha ao carregar imagem',
      retry: 'Tentar novamente'
    },
    videoPlayer: {
      loading: 'Carregando vídeo...',
      error: 'Falha ao carregar vídeo',
      retry: 'Tentar novamente',
      play: 'Reproduzir',
      pause: 'Pausar',
      mute: 'Silenciar',
      unmute: 'Ativar som',
      quality: 'Qualidade',
      qualityAuto: 'Automático',
      fullscreen: 'Entrar em tela cheia',
      exitFullscreen: 'Sair de tela cheia',
      scrub: 'Procurar na linha do tempo do vídeo'
    },
    videoGenerationModal: {
      title: 'Gerar vídeo',
      generateVideoNeeds: 'A geração de vídeo requer',
      generateNow: 'Gerar agora'
    },
    authForm: {
      signIn: 'Entrar',
      register: 'Cadastrar',
      email: 'E-mail',
      password: 'Senha',
      confirmPassword: 'Confirmar senha',
      forgotPassword: 'Esqueceu a senha?',
      createAccount: 'Cadastrar',
      dontHaveAccount: 'Ainda não tem conta?',
      alreadyHaveAccount: 'Já tem conta?',
      signInHere: 'Entre aqui',
      or: 'Ou',
      google: 'Google',
      apple: 'Apple',
      verificationCode: 'Código de verificação',
      resend: 'Reenviar',
      resetPassword: 'Redefinir senha',
      newPassword: 'Nova senha',
      confirmNewPassword: 'Confirmar nova senha',
      backToLogin: 'Voltar ao login',
      passwordLengthError: 'A senha deve ter entre 6-16 caracteres',
      passwordMismatch: 'As senhas não coincidem',
      invalidEmail: 'Informe um e-mail válido',
      pleaseFillAllFields: 'Preencha todos os campos',
      pleaseEnterEmail: 'Informe o e-mail',
      pleaseEnterCode: 'Informe o código de verificação completo de 6 dígitos',
      setNewPassword: 'Definir nova senha',
      login: 'Entrar',
      loggingIn: 'Entrando...',
      registering: 'Cadastrando...',
      registerFailed: 'O cadastro falhou, tente novamente mais tarde',
      sendingCode: 'Enviando...',
      passwordResetSuccess: 'Senha redefinida com sucesso',
      registrationSuccess: 'Cadastro concluído',
      loginSuccess: 'Login realizado com sucesso',
      secondsBeforeResend: 'segundos para reenviar',
      pleaseEnterPassword: 'Informe a senha',
      pleaseEnterNewPassword: 'Informe a nova senha',
      pleaseConfirmNewPassword: 'Confirme a nova senha',
      fillNewPassword: 'Preencha a nova senha',
      codeSentTo: 'O código de verificação foi enviado para',
      codeSent: 'Código de verificação enviado',
      sendCode: 'Enviar código de verificação',
      sending: 'Enviando...',
      verifying: 'Verificando...',
      verify: 'Verificar',
      resetting: 'Redefinindo...',
      back: 'Voltar',
      enterEmailForCode: 'Informe seu e-mail, enviaremos um código de verificação',
      verification: 'Verificação',
      emailPlaceholder: 'Informe seu e-mail',
      passwordPlaceholder: 'Informe sua senha',
      confirmPasswordPlaceholder: 'Confirme sua senha',
      verificationCodePlaceholder: 'Informe o código de verificação de 6 dígitos',
      fillEmailAndPassword: 'Preencha e-mail e senha',
      fillAllFields: 'Preencha todos os campos',
      enterEmail: 'Informe seu e-mail',
      completeVerificationCode: 'Informe o código de verificação completo de 6 dígitos',
      passwordLength: 'A senha deve ter entre 6-16 caracteres',
      resetSuccess: 'Senha redefinida com sucesso!'
    },
    changePasswordModal: {
      title: 'Alterar senha',
      currentPasswordPlaceholder: 'Senha atual',
      newPasswordPlaceholder: 'Nova senha',
      confirmPasswordPlaceholder: 'Confirmar nova senha',
      confirmChange: 'Confirmar alteração',
      changing: 'Alterando...',
      passwordLengthError: 'A senha deve ter 8-16 caracteres',
      passwordLowercaseError: 'A senha deve conter pelo menos uma letra minúscula',
      passwordNumberError: 'A senha deve conter pelo menos um número',
      passwordSpecialCharError: 'A senha deve conter pelo menos um caractere especial',
      currentPasswordRequired: 'Informe a senha atual',
      newPasswordRequired: 'Informe a nova senha',
      passwordMismatch: 'As senhas não coincidem',
      changeSuccess: 'Senha alterada com sucesso'
    },
    consumptionDetailModal: {
      title: 'Detalhes de consumo',
      overview: 'Visão geral',
      totalConsumption: 'Consumo total',
      totalRecharge: 'Recarga total',
      consumptionAmount: 'Valor consumido',
      selectCategoryHint: 'Selecione uma categoria para ver detalhes',
      operationTime: 'Hora da operação',
      period: 'Período',
      noRecords: 'Sem registros de consumo',
      noRecordsDescription: 'Ainda não tem registros de consumo',
      app: 'App',
      content: 'Conteúdo',
      time: 'Hora',
      operationType: 'Tipo de operação',
      details: 'Detalhes',
      create: 'Criar',
      update: 'Atualizar',
      delete: 'Excluir',
      use: 'Usar',
      fetchError: 'Falha ao buscar detalhes de consumo',
      fetchOverviewError: 'Falha ao buscar visão geral de consumo',
      loadingMore: 'Carregando...',
      noMoreData: 'Não há mais dados',
      noCategories: 'Sem categorias de consumo',
      noCategoriesDescription: 'Não existem categorias de consumo disponíveis',
      types: {
        textChat: 'Chat de texto',
        voiceChat: 'Chat de voz',
        imageGeneration: 'Geração de imagem',
        videoGeneration: 'Geração de vídeo',
        subscription: 'Assinatura',
        buyDiamonds: 'Comprar diamantes',
        checkIn: 'Check-in',
        register: 'Cadastro',
        other: 'Outro',
        consumption: 'Consumo',
        recharge: 'Recarga',
        amount: 'Valor'
      }
    },
    consumptionModal: {
      insufficientBalance: 'Saldo insuficiente',
      goToBuy: 'Vá comprar diamantes',
      buyDiamonds: 'Comprar diamantes'
    },
    createStep: {
      myAI: 'Minha IA',
      myAIDescription: 'Ver IA criada',
      createAI: 'Criar IA',
      createAIDescription: 'Criar nova personagem de IA',
      stepCountFormat: '{current}/{total}'
    }
  },
  error: {
    networkError: 'Erro de conexão de rede',
    serverError: 'Erro do servidor',
    unknownError: 'Erro desconhecido',
    sessionExpired: 'Sessão expirada, entre novamente',
    accessDenied: 'Acesso negado',
    notFound: 'Página não encontrada'
  },
  premium: {
    premium: {
      monthlyDiamonds: 'Recebe {amount} diamantes por mês (Total {total})',
      voiceCall: 'Fazer chamadas de voz com IA',
      createAIGirlfriend: 'Cria a tua própria namorada IA',
      unlimitedCommunication: 'Chat de texto ilimitado',
      removeImageBlur: 'Remover o desfoque das imagens',
      generateImages: 'Gerar imagens',
      generateVideos: 'Gerar vídeos',
      fastResponse: 'Velocidade de resposta ultrarrápida',
      unlockPrivateVideos: 'Desbloquear vídeos privados',
      goToPro: 'Ir para Pro',
      getMonthly: 'Receber mensalmente',
      freeTokens: '100 diamantes grátis por mês',
      pay: 'Pagar',
      waitForPackage: 'Aguarde o carregamento do pacote',
      selectPackage: 'Selecione um pacote Pro',
      membershipPayment: 'Pagamento de assinatura de membro',
      subscribe: 'Assinar',
      vipMembership: 'mês de assinatura Pro',
      failedToLoadPrice: 'Falha ao carregar preço Pro:',
      loading: 'Carregando...',
      noHiddenFees: 'Sem taxas ocultas',
      unsubscribe: 'Cancele a assinatura a qualquer momento',
      bankStatement: 'O extrato bancário não exibirá pagamento de conteúdo adulto',
      noPackagesAvailable: 'Sem pacotes disponíveis'
    },
    priceCard: {
      month: 'Mês',
      months: 'Meses',
      perMonth: '/mês',
      perMo: 'mês'
    },
    month: 'Mês',
    purchaseDiamonds: {
      diamonds: 'Diamantes',
      loading: 'Carregando...',
      pay: 'Pagar',
      selectPackage: 'Selecione um pacote',
      failedToLoadPrice: 'Falha ao carregar preço dos diamantes:',
      pleaseSelectPackage: 'Selecione um pacote primeiro',
      diamondPayment: 'Pagamento de compra de diamantes',
      purchase: 'Comprar'
    }
  },
  header: {
    createAccount: 'Cadastrar',
    login: 'Entrar',
    profile: 'Perfil',
    subscription: 'Assinatura',
    logout: 'Sair',
    pro: 'PRO',
    maxDiscount: 'Até −75%',
    buyDiamonds: 'Comprar diamantes',
    likeSuccess: 'Curtiu com sucesso',
    unlikeSuccess: 'Curtida removida com sucesso',
    likeError: 'Falha ao curtir, tente novamente mais tarde'
  },
  notificationCenter: {
    title: 'Central de notificações',
    noNotifications: 'Sem notificações',
    markAllAsRead: 'Marcar tudo como lido',
    clearAll: 'Limpar tudo',
    newNotification: 'Nova notificação',
    timeAgo: {
      justNow: 'Agora mesmo',
      minutesAgo: '{minutes} minutos atrás',
      hoursAgo: '{hours} horas atrás',
      daysAgo: '{days} dias atrás',
      weeksAgo: '{weeks} semanas atrás',
      monthsAgo: '{months} meses atrás'
    }
  },
  paymentModal: {
    defaultTitle: 'Pagamento',
    creditCardPayment: 'Pagamento com cartão',
    cryptoPayment: 'Pagamento com criptomoeda',
    userSelectedCreditCard: 'Usuário selecionou pagamento com cartão',
    userSelectedCrypto: 'Usuário selecionou pagamento com criptomoeda',
    proActivationSuccess: 'Ativação Pro concluída',
    proActivationFailed: 'Falha na ativação Pro',
    refreshUserInfoFailed: 'Falha ao atualizar info do usuário',
    selectPaymentMethod: 'Selecionar método de pagamento',
    payNow: 'Pagar agora',
    pleaseWait: 'Aguarde um momento antes de tentar novamente.',
    paymentFailed: 'Falha ao iniciar o pagamento. Tente novamente.',
    networkError: 'Erro de ligação à rede. Verifique a internet e tente novamente.',
    timeout: 'O pedido excedeu o tempo limite. Tente novamente mais tarde.',
    noPaymentUrl: 'Não foi possível obter o link de pagamento. Tente novamente mais tarde.'
  },
  paymentCallback: {
    successVip: 'Assinatura VIP concluída!',
    successTokens: 'Recarga de diamantes concluída!',
    pending: 'Pagamento em processamento. Atualizámos a conta; verifique mais tarde.',
    statusMessages: {
      completed: 'Pagamento concluído.',
      pending: 'Pagamento em processamento. Verifique novamente mais tarde.',
      cancelled: 'Pagamento cancelado.',
      failed: 'Pagamento falhou. Tente novamente.',
      amountMismatch: 'A encomenda tem problemas. Contacte o suporte.',
      benefitFailed: 'Pagamento concluído, mas os benefícios não foram atribuídos. Contacte o suporte.',
      refunded: 'Pagamento reembolsado.'
    },
    status: 'Estado da encomenda: {status}',
    queryFailed: 'Falha ao consultar a encomenda'
  },
  profileModal: {
    title: 'Editar perfil',
    namePlaceholder: 'Nome',
    saveNotAvailable: 'Função de salvar ainda não disponível'
  },
  roleCard: {
    unsupportedVideo: 'Seu navegador não suporta a tag de vídeo.',
    ageYears: 'anos',
    likeOperationFailed: 'Falha ao curtir, tente novamente mais tarde'
  },
  sideBar: {
    myRole: 'Meu papel'
  },
  subscriptionModal: {
    title: 'Atualizar para Pro',
    proBenefits: 'Benefícios de membro Pro',
    monthlyDiamonds: 'Recebe {amount} diamantes por mês (Total {total})',
    voiceCall: 'Fazer chamadas de voz com IA',
    createAI: 'Crie Sua IA Exclusiva',
    unlimitedChat: 'Chat de Texto Ilimitado',
    removeImageBlur: 'Remover o desfoque das imagens',
    generateImages: 'Gerar imagens',
    generateVideos: 'Gerar vídeos',
    generateImagesAndVideos: 'Gerar Imagens e Vídeos em HD',
    unlockPrivateThemes: 'Desbloquear Coleções de Temas Privados',
    fastResponse: 'Velocidade de resposta ultrarrápida',
    later: 'Talvez mais tarde',
    upgradeNow: 'Atualizar para Pro agora',
    pay: 'Pagar',
    loading: 'Carregando...',
    noPackagesAvailable: 'Sem pacotes disponíveis'
  },
  diamondRechargeModal: {
    title: 'Saldo insuficiente',
    insufficientBalance: 'Saldo de diamantes insuficiente',
    needDiamonds: 'São necessários mais diamantes para continuar',
    tip: 'Recarregue diamantes para continuar usando chat e geração de IA',
    cancel: 'Cancelar',
    goRecharge: 'Recarregar agora'
  },
  coupon: {
    title: 'Centro de cupões',
    subtitle: 'Obtenha cupões e poupe mais nas suas compras',
    myCoupons: 'Os meus cupões',
    availableCoupons: 'Disponíveis',
    redeemCode: 'Código de resgate',
    enterCode: 'Introduzir código',
    redeem: 'Resgatar',
    claim: 'Obter',
    useNow: 'Usar agora',
    save: 'Poupar',
    validUntil: 'Válido até',
    unlimited: 'Ilimitado',
    remaining: 'Restante',
    noCoupons: 'Sem cupões disponíveis',
    noCouponsTitle: 'Nenhum cupão disponível',
    noCouponsDesc: 'Volte mais tarde para novas ofertas de cupões',
    noMyCouponsTitle: 'Ainda sem cupões',
    noMyCouponsDesc: 'Vá ao separador Disponíveis para obter o seu primeiro cupão',
    goClaim: 'Obter Cupões',
    alreadyUsed: 'Já utilizado',
    alreadyExpired: 'Expirado',
    expiringSoon: 'A expirar em breve',
    availableList: 'Cupões disponíveis',
    coupons: 'cupões',
    loading: 'A carregar cupões...',
    claimSuccess: 'Cupão obtido com sucesso',
    redeemSuccess: 'Cupão resgatado com sucesso',
    applicableType: {
      vip: 'Assinatura VIP',
      token: 'Recarga de diamantes',
      all: 'Todos os produtos'
    },
    status: {
      available: 'Disponível',
      used: 'Usado',
      expired: 'Expirado',
      cancelled: 'Cancelado'
    },
    selectCoupon: 'Selecionar cupão',
    noCoupon: 'Sem cupão',
    paymentSuccess: 'Encomenda concluída (cupão aplicado)'
  },
  cookieConsent: {
    title: 'Usamos cookies',
    description: 'Usamos cookies para melhorar sua experiência. Ao continuar usando este site, você concorda com nossa política de cookies.',
    accept: 'Aceitar',
    decline: 'Recusar'
  }
};
