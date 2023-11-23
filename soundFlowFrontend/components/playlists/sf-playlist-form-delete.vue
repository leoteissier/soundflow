<script>
export default {
  props: {
    playlist: {
      type: Object,
      required: true
    },
    getPlaylist: {
      type: Function,
      required: true
    }
  },
  methods: {
    async remove() {
      try {
        const playlistId = this.playlist.id;
        await this.$axios.$delete(`/playlists/${playlistId}`)
        this.$buefy.toast.open({
          message: `The playlist has been successfully deleted`,
          type: 'is-success',
        })
        this.closeModal()
        this.getPlaylist()
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
          <h1>Do you really want to delete <span style="color: red">"{{playlist.name}}"</span></h1>
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
