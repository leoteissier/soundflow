<script>
export default {
  data() {
    return {
      audio: null,
      volumeValue: 50,
      currentTime: 0,
      isAudioLoaded: false,
    };
  },
  computed: {
    isPlaying() {
      return this.$store.state.isPlaying;
    },
    currentMusic() {
      return this.$store.state.music;
    },
    duration() {
      const music = this.$store.state.music;
      if (music && music.duration) {
        const durationString = music.duration;
        const minutes = parseInt(durationString.split('min')[0].trim(), 10);
        const seconds = parseInt(durationString.split('s')[0].split('min')[1].trim(), 10);
        return minutes * 60 + seconds;
      }
      return 0;
    },
    audioUrl() {
      return `${this.$store.state.music.music_link}`;
    },
    volume: {
      get() {
        return this.volumeValue;
      },
      set(value) {
        this.volumeValue = value;
        if (this.audio) {
          this.audio.volume = value / 100;
        }
      }
    },
    // currentTimeFormatted() {
    //   return Math.ceil(this.currentTime);
    // },
  },
  watch: {
    isPlaying(value) {
      if (value) {
        this.play();
      } else {
        this.pause();
      }
    },
    currentMusic() {
      if (this.isPlaying) {
        this.currentTime = 0; // Réinitialise la position de lecture
        this.play();
      }
      return this.$store.state.music;
    },
    volume(value) {
      this.volumeValue = value;
    }
  },
  beforeDestroy() {
    if (this.audio) {
      this.audio.pause();
      this.audio.removeEventListener('ended', this.handleAudioEnded);
      this.audio.removeEventListener('timeupdate', this.handleTimeUpdate);
      this.audio = null;
    }
  },
  methods: {
    async play() {
      this.$store.commit('setIsPlaying', true);
      await this.updateAudio(this.audioUrl);

      if (this.audio) {
        this.audio.currentTime = this.currentTime;
        this.audio.play();
      }
    },
    pause() {
      this.$store.commit('setIsPlaying', false);
      if (this.audio && !this.audio.paused) {
        this.currentTime = this.audio.currentTime; // Sauvegarde la position de lecture actuelle
        this.audio.pause();
      }
    },
    updateAudio() {
      return new Promise((resolve, reject) => {
        if (this.audio) {
          this.audio.pause();
          this.audio.removeEventListener('ended', this.handleAudioEnded);
          this.audio.removeEventListener('timeupdate', this.handleTimeUpdate);
          this.audio = null;
        }

        this.audio = new Audio();
        this.audio.src = this.audioUrl;
        this.audio.volume = this.volumeValue / 100;
        // Si l'audio a déjà été joué, on reprend la lecture à la position actuelle
        if (this.currentTime > 0) {
          this.audio.currentTime = this.currentTime;
        } else {
          this.audio.currentTime = 0;
        }
        this.audio.addEventListener('ended', this.handleAudioEnded);
        this.audio.addEventListener('timeupdate', this.handleTimeUpdate);

        // Attendez que l'audio soit chargé avant de résoudre la promesse
        this.audio.addEventListener('canplaythrough', () => {
          this.isAudioLoaded = true; // L'audio est chargé et prêt à être joué
          resolve();
        });

        this.audio.load();
      });
    },
    handleSliderChange(value) {
      const roundedValue = Math.round(value);
      if (this.audio) {
        this.audio.currentTime = roundedValue;
      }
      this.currentTime = roundedValue;
    },
    handleTimeUpdate() {
      if (this.isPlaying && this.audio) {
        this.currentTime = this.audio.currentTime;
      }
    },
    handleAudioEnded() {
      this.$store.commit('setIsPlaying', false);
      this.currentTime = 0; // Réinitialise la position de lecture
    },
    formatTime(time) {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },
  },
};
</script>

<template>
  <section class="player">
    <div class="info">
      <h1>{{ currentMusic.title }}</h1>
      <p>{{ currentMusic.artist }}</p>
    </div>
    <div class="action-button">
      <b-button v-if="isAudioLoaded && !isPlaying" icon-left="play" size="is-small" alt="play music button" rounded @click="play"></b-button>
      <b-button v-else-if="isAudioLoaded && isPlaying" icon-left="pause" size="is-small" alt="pause music button" rounded @click="pause"></b-button>
    </div>
    <div class="time-rail">
      <span>{{ formatTime(currentTime) }}</span>
      <b-slider v-model="currentTime" :max="duration" :step="1" rounded @change="handleSliderChange"/>
      <span>{{ formatTime(duration) }}</span>
    </div>
    <div class="options">
      <div class="volume">
        <b-icon icon="volume-high"></b-icon>
        <b-slider v-model="volume" rounded></b-slider>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.player {
  grid-column: 1/3;
  grid-row: 3/4;
  display: grid;
  grid-template-columns: 20% 1fr 20%;
  grid-template-rows: 1fr 1fr;
  padding: 10px 20px;
  z-index: 10;
}
.info {
  grid-column: 1/2;
  grid-row: 1/3;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  & > * {
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
.action-button {
  grid-column: 2/3;
  grid-row: 1/2;
  display: flex;
  justify-content: center;
  align-items: center;
  button {
    width: 40px;
    height: 40px;
    font-size: 1.5rem;
    padding: 0 5px;
    border-radius: 50%;
    &:focus{
      box-shadow: none;
    }
  }
}
.time-rail {
  grid-column: 2/3;
  grid-row: 2/3;
  display: flex;
  justify-content: center;
  align-items: center;
  .b-slider{
    width: 100%;
    height: 5px;
    margin: 0 15px;
  }
}
.options {
  grid-column: 3/4;
  grid-row: 1/3;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
  .volume {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 70%;
    .b-slider {
      margin-left: 10px;
    }
  }
}
@media screen and (max-width: 768px) {
  .player{
    grid-column: 1/2;
    grid-row: 3/4;
    display: grid;
    grid-template-columns: 1fr 50px;
    grid-template-rows: 1fr 10px;
    padding: 0;
    border-radius: 8px;
    .info{
      grid-column: 1/2;
      grid-row: 1/2;
      width: 300px;
      padding-left: 10px;
      & > * {
        width: 100%;
      }
      h1{
        font-size: 1.2rem;
        font-weight: bold;
      }
      p{
        font-size: 1rem;
      }
    }
    .action-button{
      grid-column: 2/3;
      grid-row: 1/2;
      width: 100%;
      button{
        margin: 0;
        font-size: 1.3rem;
      }
    }
    .time-rail{
      grid-column: 1/3;
      grid-row: 2/3;
      width: 100%;
      .b-slider{
        width: 100%;
        margin: 0;
      }
      span{
        display: none;
      }
    }
    .options{
      grid-column: 2/3;
      grid-row: 1/2;
      width: 100%;
      display: none!important;
      .volume{
        width: 80%;
      }
    }
  }
}
</style>
