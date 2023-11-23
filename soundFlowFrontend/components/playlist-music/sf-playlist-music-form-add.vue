<script>
export default {
  props: {
    allMusics: {
      type: Array,
      required: true
    },
    getPlaylistMusic: {
      type: Function,
      required: true
    }
  },
  data() {
    return {
      selectAll: false,
      selectedMusics: [] // Tableau pour stocker les musiques sélectionnées
    };
  },
  watch: {
    // Si toutes les musiques sont sélectionnées, cochez "Sélectionner tout"
    selectedMusics(value) {
      this.selectAll = value.length === this.allMusics.length;
    },
    // Si l'état de "Sélectionner tout" change, cochez/décochez toutes les musiques
    selectAll(value) {
      if (value) {
        this.selectedMusics = this.allMusics.map(music => music.id);
      } else {
        this.selectedMusics = [];
      }
    }
  },
  methods: {
    async add() {
      try {
        if (this.selectedMusics.length === 0) {
          this.$buefy.toast.open({
            message: 'You must select at least one music',
            type: 'is-danger'
          });
          return; // Ajout d'un retour pour arrêter l'exécution en cas d'erreur
        }
        const url = document.location.href;
        const playlistId = url.split('/').pop();
        const selectedMusicIds = this.selectedMusics; // Récupérer les IDs des musiques sélectionnées

        for (const musicId of selectedMusicIds) {
          await this.$axios.$post(`/playlists/${playlistId}/musics/${musicId}`);
        }

        this.$buefy.toast.open({
          message: `The music has been added to the playlist`,
          type: 'is-success',
        });

        this.closeModal();
        this.getPlaylistMusic();
      } catch (error) {
        // console.error(error);
      }
    },
    toggleSelectAll() {
      if (this.selectAll) {
        this.selectedMusics = this.allMusics.map(music => music.id);
      } else {
        this.selectedMusics = [];
      }
    },
    closeModal() {
      this.$emit('close');
    },
  },
}
</script>

<template>
  <form @submit.prevent="add">
    <div class="modal-card" style="width: auto">
      <header class="modal-card-head">
        <p class="modal-card-title">Add tracks to Playlist</p>
        <button type="button" class="delete" @click="closeModal()" />
      </header>
      <section class="modal-card-body">
        <b-field>
          <ul>
            <li>
              <b-checkbox v-model="selectAll" @input="toggleSelectAll">Select All</b-checkbox>
            </li>
            <li v-for="music in allMusics" :key="music.id">
              <label class="flex flex-ai-center m-10">
                <b-checkbox v-model="selectedMusics" :native-value="music.id" />
                <div class="ellipsis" :title="`${music.title} - ${music.artist}`">{{ music.title }} - {{ music.artist }}</div>
              </label>
            </li>
          </ul>
        </b-field>
      </section>
      <footer class="modal-card-foot">
        <div class="buttons">
          <b-button type="is-primary" native-type="submit" expanded>Add</b-button>
        </div>
      </footer>
    </div>
  </form>
</template>

<style scoped>
.ellipsis {
  max-width: 80%;
}
</style>
