<script>
export default {
  props: {
    getPlaylist: {
      type: Function,
      required: true
    }
  },
  data() {
    return {
      name: null,
      // datepicker
      showWeekNumber: false,
      locale: undefined ,// Browser locale

    }
  },
  methods: {
    async addPlaylist() {
      try {
        await this.$axios.$post(`/playlists`, {
          name: this.name
        })
        this.$buefy.toast.open({
          message: 'Playlist added',
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
  <form @submit.prevent="addPlaylist">
    <div class="modal-card" style="width: auto">
      <header class="modal-card-head">
        <p class="modal-card-title">Create a new Playlist</p>
        <button
          type="button"
          class="delete"
          @click="closeModal()"/>
      </header>
      <section class="modal-card-body">
        <b-field label="Name">
          <b-input
            v-model="name"
            placeholder="Name"
            required
            type="text">
          </b-input>
        </b-field>
      </section>
      <footer class="modal-card-foot">
        <div class="buttons">
          <b-button type="is-primary" native-type="submit" expanded>Create</b-button>
        </div>
      </footer>
    </div>
  </form>
</template>

<style scoped>
.tags {
  width: 370px;
  flex-wrap: wrap;
}
.dropdown-content{
  max-width: 100%!important;
  max-height: 400px!important;
  overflow-y: auto;
}
</style>
