<script>
import { saveAs } from 'file-saver';
import SFPlaylistMusicModalFormAdd from "~/components/playlist-music/sf-playlist-music-form-add.vue";
import SFPlaylistMusicModalFormEdit from "~/components/playlist-music/sf-playlist-music-form-edit.vue";
import SFPlaylistMusicModalFormDelete from "~/components/playlist-music/sf-playlist-music-form-delete.vue";
export default {
  data() {
    const musics = []
    return {
      musics,
      playlist: {},
      selected: musics[1],
      columns: [
        { field: "position", label: "#", width: "40", numeric: true, centered: true },
        // { field: "id", label: "ID", width: "40", numeric: true, centered: true },
        { field: "title", label: "Title" },
        { field: "artist", label: "Artist" },
        { field: "album", label: "Album" },
        { field: "style", label: "Style" },
        { field: "start_date", label: "Start date", centered: true },
        { field: "end_date", label: "End date", centered: true },
        { field: "duration", label: "Duration", centered: true },
        { field: "status", label: "Status", centered: true },
      ],
      // filtre
      search: '',
      // options
      loading: true,
      // drag and drop
      draggingRow: null,
      draggingRowIndex: null,
      draggingColumn: null,
      draggingColumnIndex: null,
      // playlist info
      playlist_name: '',
      playlist_nbMusic: '',
      playlist_duration: '',
    }
  },
  watch: {
    selected(row) {
      this.$store.commit('setMusic', row);
      this.$store.commit('setIsPlaying', true);
    },
  },
  mounted() {
    this.getPlaylistMusic();
    this.getMusic();
  },
  methods: {
    // récupération des musiques de la playlist
    // récupération des musiques de la playlist
    async getPlaylistMusic() {
      try {
        const url = document.location.href;
        const id = url.split('/').pop();
        const response = await this.$axios.$get(`/playlists/${id}/musics?search=${this.search}`);
        this.musics = response.data.map((item) => {
          // Format the style
          const styles = item.style.split(',').slice(0, 2).join(',')

          // Format the date
          const formattedStartDate = new Date(item.start_date).toLocaleDateString()
          const formattedEndDate = new Date(item.end_date).toLocaleDateString()

          // Format the duration
          const duration = item.duration // Assuming the duration property is named "duration"
          const minutes = Math.floor(duration / 60)
          const seconds = duration % 60
          const formattedDuration = `${minutes}min ${seconds}s`

          const status = item.blocked === "true" ? 'Blocked' : 'OK to listen';

          return {
            ...item,
            style: styles,
            start_date: formattedStartDate,
            end_date: formattedEndDate,
            duration: formattedDuration,
            status,
          }
        })
        this.totalCount = response.totalCount // total number of musics
        this.playlist_name = response.playlist_name // playlist name
        this.playlist_duration = response.duration // playlist duration
        this.playlist_nbMusic = response.nbMusic // number of musics
        this.loading = false
      } catch (error) {
        // console.error(error);
      }
    },
    // recupération des musiques
    async getMusic() {
      try {
        const response = await this.$axios.$get(`/musics/${this.$auth.user.id}`);
        this.allMusics = response.data;
      } catch (error) {
        // console.error(error);
      }
    },
    // ajouter une musique
    add() {
      const getPlaylistMusic = this.getPlaylistMusic.bind(this);
      this.$buefy.modal.open({
        parent: this,
        component: SFPlaylistMusicModalFormAdd,
        trapFocus: true,
        hasModalCard: true,
        props: {
          allMusics: this.allMusics,
          getPlaylistMusic,
        },
      })
    },
    // édition d'une musique
    edit(music) {
      const getPlaylistMusic = this.getPlaylistMusic.bind(this);
      this.$buefy.modal.open({
        parent: this,
        component: SFPlaylistMusicModalFormEdit,
        trapFocus: true,
        hasModalCard: true,
        props: {
          music,
          getPlaylistMusic,
        },
      })
    },
    // supprimer une musique
    remove(music) {
      const getPlaylistMusic = this.getPlaylistMusic.bind(this)
      this.$buefy.modal.open({
        parent: this,
        component: SFPlaylistMusicModalFormDelete,
        trapFocus: true,
        hasModalCard: true,
        props: {
          music,
          getPlaylistMusic,
        },
      })
    },
    // exporter une playlist
    exportPlaylist() {
      try {
        const url = document.location.href;
        const id = url.split('/').pop();
        this.$axios.$get(`/playlists/${id}/export`)
          .then((response) => {
            let m3uContent = '#EXTM3U\n\n';
            m3uContent += `#PLAYLIST:${this.playlist_name}\n`;

            response.forEach((file) => {
              if (file.blocked === 'false') {
                const duration = file.duration;
                const minutes = Math.floor(duration / 60);
                const seconds = duration % 60;
                const formattedDuration = minutes * 60 + seconds;

                m3uContent += `#EXTINF:${formattedDuration},${file.artist} - ${file.title}\n`;
                m3uContent += `#EXTALB:${file.album}\n`; // for album
                m3uContent += `#EXTGENRE:${file.style}\n`; // for style
                m3uContent += `${file.link}\n`;
              }
            });

            const blob = new Blob([m3uContent], { type: 'audio/x-mpegurl' });
            saveAs(blob, `${this.playlist_name}.m3u`);
            this.$buefy.toast.open({
              message: 'Playlist exported',
              type: 'is-success',
            });
          })
          .catch(() => {
            this.$buefy.toast.open({
              message: 'Error while exporting playlist',
              type: 'is-danger',
            });
          });
      } catch (error) {
        // console.error(error)
      }
    },
    // drag and drop
    dragstart(payload) {
      this.draggingRow = payload.row;
      this.draggingRowIndex = payload.index;
      payload.event.dataTransfer.effectAllowed = 'copy';
    },
    dragover(payload) {
      payload.event.dataTransfer.dropEffect = 'copy';
      payload.event.target.closest('tr').classList.add('is-selected');
      payload.event.preventDefault();
    },
    dragleave(payload) {
      payload.event.target.closest('tr').classList.remove('is-selected');
      payload.event.preventDefault();
    },
    drop(payload) {
      payload.event.target.closest('tr').classList.remove('is-selected');
      const droppedOnRowIndex = payload.index;

      if (this.draggingRowIndex !== droppedOnRowIndex) {
        // Reorder the musics array based on the drag and drop
        const movedItem = this.musics.splice(this.draggingRowIndex, 1)[0];
        this.musics.splice(droppedOnRowIndex, 0, movedItem);

        // Update the positions in the musics array
        this.musics.forEach((music, index) => {
          music.position = index + 1;
        });

        // You can make an API call here to update the positions in the backend database
        const url = document.location.href;
        const playlistId = url.split('/').pop();
        const id = movedItem.playlist_music_id;
        const newPosition = droppedOnRowIndex + 1;

        this.$axios.put(`/playlists/${playlistId}/musics/${id}`, { position: newPosition })
          .then(() => {
            this.$buefy.toast.open({
              message: `Music ${movedItem.title} moved to position ${newPosition}`,
              type: 'is-success',
            });
          })
          .catch(() => {
            // console.error(error);
            this.$buefy.toast.open({
              message: `Error while moving music ${movedItem.title} to position ${newPosition}`,
              type: 'is-danger',
            });
          });
      } else {
        this.$buefy.toast.open({
          message: `You tried to move ${this.draggingRow.title} to the same position`,
          type: 'is-danger',
        });
      }
    },
    columndragstart(payload) {
      this.draggingColumn = payload.column
      this.draggingColumnIndex = payload.index
      payload.event.dataTransfer.effectAllowed = 'copy'
    },
    columndragover(payload) {
      payload.event.dataTransfer.dropEffect = 'copy'
      payload.event.target.closest('th').classList.add('is-selected')
      payload.event.preventDefault()
    },
    columndragleave(payload) {
      payload.event.target.closest('th').classList.remove('is-selected')
      payload.event.preventDefault()
    },
    columndrop(payload) {
      payload.event.target.closest('th').classList.remove('is-selected')
      const droppedOnColumnIndex = payload.index
      this.$buefy.toast.open(`Moved ${this.draggingColumn.field} from column ${this.draggingColumnIndex + 1} to ${droppedOnColumnIndex + 1}`)
    }
  },
}
</script>

<template>
  <section class="app">

    <div class="flex flex-jc-sb m-b-10">
      <h1>{{ playlist_name }}</h1>
      <nuxt-link to="/playlists" class="button-responsive">
        <button class="back button is-outlined" alt="back button">
          <span class="icon is-small">
            <i class="mdi mdi-arrow-left"></i>
          </span>
          <span>Go Back</span>
        </button>
      </nuxt-link>
    </div>

    <div class="flex flex-jc-sb m-b-10">
      <b-input v-model="search" v-debounce:400ms="getPlaylistMusic" placeholder="Search" icon="magnify"></b-input>
      <div class="button-responsive">
        <button class="button is-success" alt="add button" @click="add()">
          <span class="icon is-small">
            <i class="mdi mdi-playlist-plus"></i>
          </span>
          <span>Add tracks to playlist</span>
        </button>
        <button class="button is-success" alt="export button" @click="exportPlaylist()">
          <span class="icon is-small">
            <i class="mdi mdi-export"></i>
          </span>
          <span>Exporter</span>
        </button>
      </div>
    </div>

    <b-table v-if="musics.length > 0" :data="musics" draggable draggable-column :selected.sync="selected" :hoverable="true" :row-class="(row) => (row.blocked !== 'false' ? 'disabled-music' : '')" @dragstart="dragstart" @drop="drop" @dragover="dragover" @dragleave="dragleave" @columndragstart="columndragstart" @columndrop="columndrop" @columndragover="columndragover" @columndragleave="columndragleave">
      <b-table-column v-for="(column, index) in columns" :key="index" v-slot="props" :field="column.field" :label="column.label" :width="column.width" :numeric="column.numeric" :centered="column.centered">
        <b-tooltip :label="props.row[column.field]">
          <p class="ellipsis">{{ props.row[column.field] }}</p>
        </b-tooltip>
      </b-table-column>
      <b-table-column v-slot="props" field="actions" label="Actions" width="150" centered>
        <div class="action">
          <b-button type="is-info" icon-left="pencil" alt="edit button" rounded @click.stop="edit(props.row)"></b-button>
          <b-button type="is-danger" icon-left="trash-can" alt="remove button" rounded @click.stop="remove(props.row)"></b-button>
        </div>
      </b-table-column>

      <div slot="footer" class="flex flex-jc-sb">
        <h2>{{ playlist_nbMusic }} sounds</h2>
        <h2>{{ playlist_duration }}</h2>
      </div>
    </b-table>

    <div v-else class="text-center">
      <h1>This table is empty</h1>
    </div>

  </section>
</template>

<style lang="scss" scoped>
.b-table{
  height: 64vh;
}
.button-responsive{
  display: flex;
  align-items: flex-end;
  button{
    margin-left: 10px;
  }
}
h1{
  font-size: 2.5rem;
  font-weight: 700;
}
@media screen and (max-width: 768px) {
  h1{
    font-size: 1.5rem;
  }
  .button-responsive button span:nth-child(2){
    display: none;
  }
  .button .icon:first-child:not(:last-child) {
    margin-right: 0;
    margin-left: 0;
  }
  .b-table{
    height: 63vh;
  }
  .control{
    width: 50%!important;
  }
}
</style>
