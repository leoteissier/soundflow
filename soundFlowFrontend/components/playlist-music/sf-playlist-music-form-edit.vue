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
  data() {
    const music = this.music;
    // formatage des infos start_date
    const partsStart = music.start_date.split('/');
    const yearStart = partsStart[2];
    const monthStart = partsStart[1] - 1; // Les mois sont numérotés à partir de 0, donc on soustrait 1
    const dayStart = partsStart[0];
    // formatage des infos end_date
    const partsEnd = music.end_date.split('/');
    const yearsEnd = partsEnd[2];
    const monthEnd = partsEnd[1] - 1; // Les mois sont numérotés à partir de 0, donc on soustrait 1
    const dayEnd = partsEnd[0];
    return {
      title: music.title,
      artist: music.artist,
      album: music.album,
      style: music.style,
      start_date: new Date(yearStart, monthStart, dayStart),
      end_date: new Date(yearsEnd, monthEnd, dayEnd),

      locale: undefined,
    }
  },
  methods: {
    async editMusic() {
      try {
        if (this.title.length > 48 || this.artist.length > 48 || this.album.length > 48 || this.style.length > 48) {
          this.$buefy.toast.open({
            message: 'Fields must not exceed 48 characters',
            type: 'is-danger'
          })
          return
        }
        // Vérification des caractères spéciaux dans les champs
        if (
          this.hasSpecialCharacters(this.title) || this.hasSpecialCharacters(this.artist) || this.hasSpecialCharacters(this.album) || this.hasSpecialCharacters(this.style)) {
          // Affichage de l'alerte Buefy en cas de caractères spéciaux détectés
          this.$buefy.toast.open({
            message: 'Special characters are not allowed',
            type: 'is-danger'
          });
          return; // Arrêter l'exécution de la méthode si des caractères spéciaux sont détectés
        }
        // verification des dates de début et de fin
        if (this.start_date > this.end_date) {
          this.$buefy.toast.open({
            message: 'Start date must be before end date',
            type: 'is-danger'
          })
          return
        }

        // Envoi de la requête de mise à jour
        await this.$axios.$put(`/musics/${this.music.id}`, {
          title: this.title,
          artist: this.artist,
          album: this.album,
          style: this.style,
          start_date: this.start_date,
          end_date: this.end_date,
        });

        // Affichage du message de succès
        this.$buefy.toast.open({
          message: 'Music updated',
          type: 'is-success'
        });

        // Fermeture de la modal et mise à jour de la liste de musiques
        this.closeModal();
        this.getPlaylistMusic();
      } catch (error) {
        // Gestion de l'erreur
        // console.error(error)
      }
    },
    clearStartDate () {
      this.start_date = new Date()
    },
    clearEndDate () {
      this.end_date = new Date()
    },
    closeModal() {
      this.$emit('close')
    },
    hasSpecialCharacters(value) {
      const regex = /[!@#$%^&*()_+\-=[\]{};':"\\|.<>?]+/;
      return regex.test(value);
    },
  },
}
</script>

<template>
  <form @submit.prevent="editMusic()">
    <div class="modal-card" style="width: auto">
      <header class="modal-card-head">
        <p class="modal-card-title">Edit track</p>
        <button
          type="button"
          class="delete"
          @click="closeModal()"/>
      </header>
      <section class="modal-card-body">
        <b-field label="title">
          <b-input v-model="title" :value="title" required></b-input>
        </b-field>
        <b-field label="artist">
          <b-input v-model="artist" :value="artist" required></b-input>
        </b-field>
        <b-field label="album">
          <b-input v-model="album" :value="album" required></b-input>
        </b-field>
        <b-field label="style">
          <b-input v-model="style" :value="style" required></b-input>
        </b-field>
        <b-field label="Select a start date">
          <b-datepicker
            v-model="start_date"
            :locale="locale"
            required
            editable
            position="is-top-left"
            placeholder="Click to select..."
            icon="calendar-today"
            :icon-right="start_date ? 'close-circle' : ''"
            icon-right-clickable
            trap-focus
            @icon-right-click="clearStartDate">
          </b-datepicker>
        </b-field>
        <b-field label="Select a end date">
          <b-datepicker
            v-model="end_date"
            :locale="locale"
            required
            editable
            position="is-top-left"
            placeholder="Click to select..."
            icon="calendar-today"
            :icon-right="end_date ? 'close-circle' : ''"
            icon-right-clickable
            trap-focus
            @icon-right-click="clearEndDate">
          </b-datepicker>
        </b-field>
      </section>
      <footer class="modal-card-foot">
        <div class="buttons">
          <b-button type="is-primary" native-type="submit" expanded>Upload</b-button>
        </div>
      </footer>
    </div>
  </form>
</template>

<style scoped>

</style>

