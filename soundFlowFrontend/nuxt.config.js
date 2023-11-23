require('dotenv').config();
export default {
  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'SoundFlow',
    htmlAttrs: {
      lang: 'en',
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge' },
      { hid: 'author', name: 'author', content: 'Léo Teissier' },
      { hid: 'robots', name: 'robots', content: 'index, follow' },
      { hid: 'description', name: 'description', content: 'Discover our online media library, inspired by Spotify, where you can listen to your favorite tracks, discover new artists and much more.' },
      { hid: 'keywords', name: 'keywords', content: 'Spotify, Deezer, music, media, library, online, listen, tracks, artists, albums, playlists, favorites, discover, search, share, create, account, login, register, profile, settings, logout' },
      { name: 'format-detection', content: 'telephone=no' },
    ],
    link: [
      { rel: 'icon', type: 'image/png', href: '/favicon.png' },
    ],
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    // main css file
    './assets/scss/main.css',
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    '~/plugins/axios.js',
    {src:  "~/plugins/vue-debounce.js", mode: "client" }
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/eslint
    '@nuxtjs/eslint-module',
    // color-mode
    '@nuxtjs/color-mode',
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/buefy
    'nuxt-buefy',
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    // https://auth.nuxtjs.org/
    '@nuxtjs/auth',
    // .env
    ['nuxt-env',
      {
        keys: [
          { key: 'SITE_TITLE', default: 'SoundFlow' },
          { key: 'API_URL' },
        ],
      },
    ],
  ],

  // buefy module configuration
  buefy: {
    css: true,
    materialDesignIcons: true,
  },

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {
    // Workaround to avoid enforcing hard-coded localhost:3000: https://github.com/nuxt-community/axios-module/issues/308
    baseURL: process.env.API_URL,
  },

  colorMode: {
    preference: 'system', // default value of $colorMode.preference
    fallback: 'light', // fallback value if not system preference found
    hid: 'nuxt-color-mode-script',
    globalName: '__NUXT_COLOR_MODE__',
    componentName: 'ColorScheme',
    classPrefix: '',
    classSuffix: '-mode',
    storageKey: 'nuxt-color-mode'
  },

  // Auth module configuration: https://auth.nuxtjs.org/
  auth: {
    redirect: {
      login: '/auth/login',
      logout: '/auth/login',
      home: false,
    },
    rewriteRedirects: false,
    strategies: {
      local: {
        endpoints: {
          login: {
            url: '/auth/login',
            method: 'post',
            propertyName: 'token',
          },
          logout: { url: '/auth/logout', method: 'post' },
          user: { url: '/auth/profile', method: 'get' },
        },
      },
    },
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {},
}
