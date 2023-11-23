<script>
export default {
  computed: {
    getThemeIcon() {
      return this.$auth.user.display === 'light'
        ? 'https://www.uplooder.net/img/image/55/7aa9993fc291bc170abea048589896cf/sun.svg'
        : 'https://www.uplooder.net/img/image/2/addf703a24a12d030968858e0879b11e/moon.svg';
    },
    themeClass() {
      return this.$auth.user.display === 'light' ? 'shadow-light' : 'shadow-dark';
    },
    getLogo() {
      return this.$auth.user.display === 'light'
        ? '/logo_soundflow_light.png'
        : '/logo_soundflow_dark.png';
    },
  },
  methods: {
    logout() {
      localStorage.removeItem('welcomeMessageShown');
      this.$auth.logout();
    },
    async toggleStyleMode() {
      const newMode = this.$auth.user.display === 'light' ? 'dark' : 'light';
      await this.updateDisplayInDatabase(newMode);
      this.$auth.user.display = newMode;
      this.$colorMode.preference = newMode; // mise à jour du mode d'affichage avec la nouvelle valeur
    },
    async updateDisplayInDatabase(newDisplay) {
      const userId = this.$auth.user.id;
      try {
        await this.$axios.put(`/users/${userId}/display`, { display: newDisplay });
      } catch (error) {
        this.$buefy.toast.open({
          message: 'An error occurred while updating your display mode',
          type: 'is-danger',
        });
      }
    },
  },
};
</script>

<template>
  <nav class="navbar">
    <div class="logo">
      <img class="img" :src="getLogo" alt="Logo SoundFlow">
    </div>
    <div class="nab-button">
      <div :class="['theme-container', themeClass]" @click="toggleStyleMode">
        <img id="theme-icon" :src="getThemeIcon" alt="Theme Icon">
      </div>
      <b-button type="is-primary" @click="logout">Log out</b-button>
    </div>
  </nav>
</template>


<style scoped>
.navbar {
  grid-column: 1/3;
  grid-row: 1/2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
}
.logo{
  width: 220px;
  height: auto;
}
.nab-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 150px;
}

@media screen and (max-width: 768px) {
  .navbar {
    grid-column: 1/2;
    grid-row: 1/2;
  }
}
</style>
