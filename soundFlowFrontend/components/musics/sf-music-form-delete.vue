<script>
export default {
  props: {
    music: {
      type: Object,
      required: true
    },
    getMusic: {
      type: Function,
      required: true
    }
  },
  methods: {
    async remove() {
      try {
        const musicId = this.music.id;
        await this.$axios.$delete(`/musics/${musicId}`)
        this.$buefy.toast.open({
          message: `The music has been deleted`,
          type: 'is-success',
        })
        this.closeModal()
        this.getMusic()
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
        <p class="modal-card-title">Delete track</p>
        <button
          type="button"
          class="delete"
          @click="closeModal()"/>
      </header>
      <section class="modal-card-body">
        <b-field>
          <h1>Do you really want to delete <span style="color: red">"{{music.title}}"</span></h1>
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
