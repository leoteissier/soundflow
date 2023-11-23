<script>
export default {
  name: 'Index',
  middleware: ['auth'],
  mounted() {
    this.$router.push('/musics');
  }
}
</script>

<template>
  <div>

  </div>
</template>

<style scoped>

</style>
