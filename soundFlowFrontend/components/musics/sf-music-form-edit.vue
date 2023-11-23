<script>
import { format } from 'date-fns';
export default {
  props: {
    music: {
      type: Object,
      required: true
    },
    getMusic: {
      type: Function,
      required: true
    },
  },
  data() {
    const music = this.music;
    // // formatage des infos start_date
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
        if (this.start_date >= this.end_date) {
          this.$buefy.toast.open({
            message: 'Start date must be before end date',
            type: 'is-danger'
          })
          return;
        }
        const formattedStartDate = format(this.start_date, 'dd MMMM yyyy');
        const formattedEndDate = format(this.end_date, 'dd MMMM yyyy');
        await this.$axios.$put(`/musics/${this.music.id}`, {
          title: this.title,
          artist: this.artist,
          album: this.album,
          style: this.style,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
        })
        this.$buefy.toast.open({
          message: 'Music updated',
          type: 'is-success'
        })
        this.closeModal()
        this.getMusic()
        } catch (error) {
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
          <b-button type="is-primary" native-type="submit" expanded>Edit</b-button>
        </div>
      </footer>
    </div>
  </form>
</template>

<style scoped>

</style>
