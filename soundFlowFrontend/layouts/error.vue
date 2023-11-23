<template>
  <section class="container">
    <div class="errorMessage">
      <h1>{{ error.statusCode }}</h1>
      <p>Oops!</p>
      <p>{{ error.message }}</p>
      <button @click="handleClearError">Go back home</button>
    </div>
    <div :class="['theme-container', themeClass]" @click="toggleStyleMode">
      <img id="theme-icon" :src="getThemeIcon" alt="Theme Icon">
    </div>
  </section>
</template>

<script>
export default {
  layout: 'blank',
  props: {
    error: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      email: '',
      password: '',
      rememberMe: false,
      themeIcon: null,
    };
  },
  computed: {
    getThemeIcon() {
      return this.$colorMode.value === 'light'
        ? 'https://www.uplooder.net/img/image/55/7aa9993fc291bc170abea048589896cf/sun.svg'
        : 'https://www.uplooder.net/img/image/2/addf703a24a12d030968858e0879b11e/moon.svg';
    },
    themeClass() {
      return this.$colorMode.value === 'light' ? 'shadow-light' : 'shadow-dark';
    },
  },
  methods: {
    handleClearError() {
      this.$store.dispatch('error/clearError')
      if (this.$store.state.auth.user) {
        this.$router.push('/musics')
      } else {
        this.$router.push('/auth/login')
      }
    },
    toggleStyleMode() {
      if (this.$colorMode.value === 'light') {
        this.$colorMode.value = 'dark';
        this.themeIcon = 'https://www.uplooder.net/img/image/2/addf703a24a12d030968858e0879b11e/moon.svg';
      } else {
        this.$colorMode.value = 'light';
        this.themeIcon = 'https://www.uplooder.net/img/image/55/7aa9993fc291bc170abea048589896cf/sun.svg';
      }
    },
  }
}
</script>

<style lang="scss" scoped>
.container {
  grid-column: 1/3;
  grid-row: 1/4;
  width: 100%;
  height: 100%;
  max-width: 100%!important;
  max-height: 100%;
  position: relative;
  display: grid;
}
.errorMessage{
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
h1 {
  font-size: 3rem;
  margin-bottom: 2rem;
}
p {
  font-size: 1.5rem;
  margin-bottom: 2rem;
}
button {
  padding: 0.5rem 1rem;
  border-radius: 5px;
  font-size: 1.5rem;
  cursor: pointer;
}
.theme-container {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  &:hover {
    transform: scale(1.1);
  }
}
</style>
