<script>
export default {
  name: 'ForgotPassword',
  auth : false ,
  layout : 'auth',
  data() {
    return {
      isSent: false,
      email: '',
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
  created() {
    this.themeIcon = this.getThemeIcon;
  },
  methods: {
    async submitForm(){
      const forgotPasswordData = {
        email: this.email,
      };
      try {
        await this.$axios.$post('/auth/forgot-password', forgotPasswordData);
        this.isSent = true;
      } catch (error) {
        // console.error(error);
      }
    },
    reset() {
      this.isSent = false;
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
  },
}
</script>

<template>
  <section class="formulaire">
    <form v-if="!isSent" @submit.prevent="submitForm">
      <h3>Forgot your password</h3>
      <div class="w-70">
        <b-field label="Email">
          <b-input v-model="email" type="email" maxlength="50" required></b-input>
        </b-field>
      </div>
      <b-button class="m-10 w-70" type="is-primary" outlined native-type="submit">Send</b-button>
      <nuxt-link to="/auth/login" outlined>Back to login</nuxt-link>
    </form>
    <div v-else>
      <h3>The lost password email has been sent</h3>
      <nuxt-link type="is-primary" to="/auth/login" outlined @click="reset">Back to login</nuxt-link>
    </div>
    <div :class="['theme-container', themeClass]" @click="toggleStyleMode">
      <img id="theme-icon" :src="getThemeIcon" alt="Theme Icon">
    </div>
  </section>
</template>

<style lang="scss" scoped>
@import '~assets/scss/variables.scss';
.formulaire {
  grid-column: 1/3;
  grid-row: 1/4;
  position: relative;
  width: 100%;
  height: 100%;
}
form{
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 30%;
  height: 50%;
  border-radius: 12px;
  box-shadow: 0 0 10px 1px $primary;
}
h3{
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: #7957d5;
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
@media screen and (max-width: 768px) {
  .formulaire {
    grid-column: 1/2;
    grid-row: 1/5;
  }
  form{
    width: 80%;
    height: 70%;
  }
}
</style>
