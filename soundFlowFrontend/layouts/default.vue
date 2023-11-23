<script>
import SFTopbar from '~/components/navigation/sf-topbar.vue'
import SFSidebar from '~/components/navigation/sf-sidebar.vue'
import SFMusicPlayer from '~/components/musics/sf-music-player.vue'
export default {
  name: 'DefaultLayout',
  components: {
    SFMusicPlayer,
    SFTopbar,
    SFSidebar,
  },
}
</script>

<template>
  <main id="app">
    <SFTopbar />
    <SFSidebar />
    <nuxt />
    <SFMusicPlayer />
  </main>
</template>

<style scoped lang="scss">

</style>
