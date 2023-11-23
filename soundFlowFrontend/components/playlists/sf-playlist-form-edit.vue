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
  data() {
    const playlist = this.playlist;
    return {
     name: playlist.name,
    }
  },
  methods: {
    async editPlaylist() {
      try {
        if (this.name.length > 48) {
          this.$buefy.toast.open({
            message: 'Fields must not exceed 48 characters',
            type: 'is-danger'
          })
          return
        }
        await this.$axios.$put(`/playlists/${this.playlist.id}`, {
          name: this.name,
        })
        this.$buefy.toast.open({
          message: 'Playlist updated',
          type: 'is-success'
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
  <form @submit.prevent="editPlaylist()">
    <div class="modal-card" style="width: auto">
      <header class="modal-card-head">
        <p class="modal-card-title">Edit Playlist</p>
        <button
          type="button"
          class="delete"
          @click="closeModal()"/>
      </header>
      <section class="modal-card-body">
        <b-field label="title">
          <b-input v-model="name" :value="name" required></b-input>
        </b-field>
      </section>
      <footer class="modal-card-foot">
        <div class="buttons">
          <b-button type="is-primary" native-type="submit" expanded>Edit</b-button>
        </div>
      </footer>
    </div>
  </form>
</template>

<style scoped>

</style>
