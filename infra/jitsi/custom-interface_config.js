/* eslint-disable */
// Customização da interface do Jitsi Meet para Universidade MotoChefe
// Este arquivo é montado dentro do container jitsi-web

interfaceConfig.SHOW_JITSI_WATERMARK = false;
interfaceConfig.SHOW_WATERMARK_FOR_GUESTS = false;
interfaceConfig.SHOW_BRAND_WATERMARK = false;
interfaceConfig.SHOW_POWERED_BY = false;
interfaceConfig.SHOW_PROMOTIONAL_CLOSE_PAGE = false;
interfaceConfig.MOBILE_APP_PROMO = false;
interfaceConfig.DISABLE_JOIN_LEAVE_NOTIFICATIONS = false;
interfaceConfig.DISABLE_PRESENCE_STATUS = false;
interfaceConfig.GENERATE_ROOMNAMES_ON_WELCOME_PAGE = false;
interfaceConfig.DISPLAY_WELCOME_FOOTER = false;
interfaceConfig.DISPLAY_WELCOME_PAGE_ADDITIONAL_CARD = false;
interfaceConfig.DISPLAY_WELCOME_PAGE_CONTENT = false;
interfaceConfig.DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT = false;

// App name customizado
interfaceConfig.APP_NAME = 'MotoChefe Meet';
interfaceConfig.NATIVE_APP_NAME = 'MotoChefe Meet';
interfaceConfig.PROVIDER_NAME = 'Universidade MotoChefe';

// Toolbar - botões disponíveis
interfaceConfig.TOOLBAR_BUTTONS = [
    'microphone',
    'camera',
    'desktop',
    'chat',
    'raisehand',
    'participants-pane',
    'tileview',
    'select-background',
    'fullscreen',
    'hangup',
];

// Ocultar botões de convite e gravação
interfaceConfig.TOOLBAR_ALWAYS_VISIBLE = false;
interfaceConfig.HIDE_INVITE_MORE_HEADER = true;
interfaceConfig.HIDE_DEEP_LINKING_LOGO = true;

// Configurações visuais
interfaceConfig.DEFAULT_BACKGROUND = '#111111';
interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME = 'Participante';
interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME = 'Participante';
