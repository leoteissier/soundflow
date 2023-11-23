<script>
export default {
  props: {
    music: {
      type: Object,
      required: true
    },
    getPlaylistMusic: {
      type: Function,
      required: true
    }
  },
  methods: {
    async remove() {
      try {
        const url = document.location.href
        const playlistId = url.split('/').pop()
        const id = this.music.playlist_music_id
        await this.$axios.$delete(`/playlists/${playlistId}/musics/${id}`)
        this.$buefy.toast.open({
          message: `The music has been deleted`,
          type: 'is-success',
        })
        this.closeModal()
        this.getPlaylistMusic()
      } catch (error) {
        // console.error(error)
      }
    },
    closeModal() {
      this.$emit('close')
    },
  },
}
</script>

<template>
  <form @submit.prevent="remove">
    <div class="modal-card" style="width: auto">
      <header class="modal-card-head">
        <p class="modal-card-title">Delete Playlist</p>
        <button
          type="button"
          class="delete"
          @click="closeModal()"/>
      </header>
      <section class="modal-card-body">
        <b-field>
          <h1>Are you sure you want to delete the music <span style="color: red">"{{music.title}}"</span> from this playlist</h1>
        </b-field>
      </section>
      <footer class="modal-card-foot">
        <div class="buttons">
          <b-button type="is-primary" native-type="submit" expanded>Delete</b-button>
        </div>
      </footer>
    </div>
  </form>
</template>

<style scoped>

</style>
