<script>
import {format} from "date-fns";

export default {
  props: {
    getMusic: {
      type: Function,
      required: true
    }
  },
  data() {
    return {
      files: [],
      start_date: new Date(),
      end_date: new Date(),
      // datepicker
      showWeekNumber: false,
      locale: undefined ,// Browser locale
      // loading
      loading: false,
    }
  },
  methods: {
    async addMusic() {
      try {
        if (this.files.length === 0) {
          this.$buefy.toast.open({
            message: 'You must select at least one file',
            type: 'is-danger'
          })
          return;
        }
        if (this.start_date >= this.end_date) {
          this.$buefy.toast.open({
            message: 'Start date must be before end date',
            type: 'is-danger'
          })
          return;
        }
        this.loading = true; // Définition de l'état de chargement sur true
        const formattedStartDate = format(this.start_date, 'dd MMMM yyyy');
        const formattedEndDate = format(this.end_date, 'dd MMMM yyyy');
        const formData = new FormData();
        formData.append('start_date', formattedStartDate);
        formData.append('end_date', formattedEndDate);
        for (let i = 0; i < this.files.length; i++) {
          formData.append('files', this.files[i]);
        }
        await this.$axios.post(`/musics`, formData)
        this.$buefy.toast.open({
          message: 'Music added',
          type: 'is-success'
        })
        this.closeModal()
        this.getMusic()
      } catch (error) {
        // console.error(error)
      } finally {
        this.loading = false; // Définition de l'état de chargement sur false, quelle que soit la réponse
      }
    },
    deleteDropFile(index) {
      this.files.splice(index, 1)
    },
    clearStartDate () {
      this.start_date = null
    },
    clearEndDate () {
      this.end_date = null
    },
    closeModal() {
      this.$emit('close')
    },
  },
}
</script>

<template>
  <form @submit.prevent="addMusic">
    <div v-if="loading" class="lds-ripple"><div></div><div></div></div>
    <div class="modal-card" :class="{ 'loading-opacity': loading }" style="width: auto">
      <header class="modal-card-head">
        <p class="modal-card-title">Add a new track</p>
        <button
          type="button"
          class="delete"
          @click="closeModal()"/>
      </header>
      <section class="modal-card-body">
        <b-field class="text-center">
          <b-upload v-model="files" :disabled="loading" accept="audio/*" class="upload" multiple drag-drop required>
            <section class="section">
              <div class="content has-text-centered">
                <p><b-icon icon="upload" size="is-large" /></p>
                <p>Drop your files here or click to upload</p>
              </div>
            </section>
          </b-upload>
        </b-field>
        <div class="tags">
            <span v-for="(file, index) in files" :key="index" class="tag is-primary ellipsis">
              {{file.name}}<button class="delete is-small" type="button" @click="deleteDropFile(index)"/>
            </span>
        </div>

        <b-field label="Select a start date">
          <b-datepicker
            v-model="start_date"
            :disabled="loading"
            :show-week-number="showWeekNumber"
            :locale="locale"
            position="is-top-left"
            placeholder="Click to select..."
            icon="calendar-today"
            :icon-right="start_date ? 'close-circle' : ''"
            icon-right-clickable
            trap-focus
            required
            @icon-right-click="clearStartDate">
          </b-datepicker>
        </b-field>
        <b-field label="Select a end date">
          <b-datepicker
            v-model="end_date"
            :disabled="loading"
            :show-week-number="showWeekNumber"
            :locale="locale"
            position="is-top-left"
            placeholder="Click to select..."
            icon="calendar-today"
            :icon-right="end_date ? 'close-circle' : ''"
            icon-right-clickable
            trap-focus
            required
            @icon-right-click="clearEndDate">
          </b-datepicker>
        </b-field>
      </section>
      <footer class="modal-card-foot">
        <div class="buttons">
          <b-button type="is-primary" native-type="submit" expanded :disabled="loading">Add</b-button>
        </div>
      </footer>
    </div>
  </form>
</template>

<style lang="scss" scoped>
form{
  position: relative;
}
.tags {
  width: 100%;
  flex-wrap: wrap;
}
.dropdown-content{
  max-width: 100%!important;
  max-height: 400px!important;
  overflow-y: auto;
}
// Loading
.modal-card.loading-opacity {
  opacity: 0.7;
}
.lds-ripple {
  display: inline-block;
  position: absolute;
  left: 50%;
  top: 20%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  z-index: 10;
}
.lds-ripple div {
  position: absolute;
  border: 6px solid #48c78e;
  opacity: 1;
  border-radius: 50%;
  animation: lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;
}
.lds-ripple div:nth-child(2) {
  animation-delay: -0.5s;
}
@keyframes lds-ripple {
  0% {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 0;
    height: 0;
    opacity: 1;
  }
  4.9% {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 0;
    height: 0;
    opacity: 1;
  }
  5% {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 0;
    height: 0;
    opacity: 1;
  }
  100% {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 72px;
    height: 72px;
    opacity: 0.5;
  }
}

</style>
