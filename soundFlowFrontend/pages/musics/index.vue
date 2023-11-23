<script>
import SFTableFooter from '~/components/table/sf-table-footer.vue'
import SFMusicModalFormAdd from '~/components/musics/sf-music-form-add.vue'
import SFMusicModalFormEdit from '~/components/musics/sf-music-form-edit.vue'
import SFMusicModalFormDelete from '~/components/musics/sf-music-form-delete.vue'
export default {
  auth: true,
  components: { SFTableFooter },
  data() {
    const musics = []
    return {
      musics,
      playlists: [],
      selected: musics[1],
      columns: [
        // { field: 'id', label: 'ID', width: '40', numeric: true, centered: true, sortable: true, },
        { field: 'title', label: 'Title', sortable: true },
        { field: 'artist', label: 'Artist', sortable: true },
        { field: 'album', label: 'Album', sortable: true },
        { field: 'style', label: 'Style', sortable: true },
        { field: 'start_date', label: 'Start date', centered: true, sortable: true, width: '150' },
        { field: 'end_date', label: 'End date', centered: true, sortable: true, width: '150' },
        { field: 'duration', label: 'Duration', centered: true, sortable: true, width: '150' },
      ],
      // pagination
      sortOrder: 'asc', // initial sort order
      sortField: 'id', // initial sort field
      totalPages: 0, // initial le nombre de pages
      totalCount: 0, // initial le nombre de musiques
      page: 1, // initial page
      perPages: 25, // initial rows per page
      // filtre
      search: '',
      // options
      loading: true,
      // modal
      isComponentModalActive: false,
      showModalAdd: false,
      showModalEdit: false,
      // store
      music: this.$store.state.music,
      isPlaying: this.$store.state.isPlaying,
    }
  },
  // lire la musique
  watch: {
    selected(row) {
      this.$store.commit('setMusic', row)
      this.$store.commit('setIsPlaying', true)
    },
  },
  mounted() {
    if (this.$auth.loggedIn && !localStorage.getItem('welcomeMessageShown')) {
      this.$buefy.toast.open({
        message: `Welcome ${this.$auth.user.firstname} ${this.$auth.user.lastname}`,
        type: 'is-success',
        position: 'is-top',
        duration: 5000,
      });

      localStorage.setItem('welcomeMessageShown', 'true');
    }

    this.getMusics();
    this.getPlaylist();
  },
  methods: {
    // récupération des données des musiques
    async getMusics() {
      try {
        const response = await this.$axios.$get(`/musics/${this.$auth.user.id}?page=${this.page}&limit=${this.perPages}&search=${this.search}&sort_by=${this.sortField}&sort_order=${this.sortOrder}`)
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

          return {
            ...item,
            style: styles,
            start_date: formattedStartDate,
            end_date: formattedEndDate,
            duration: formattedDuration,
          }
        })
        this.totalCount = response.totalCount // total number of musics
        this.loading = false
      } catch (error) {
        // console.error(error)
      }
    },
    // récupération des données des playlists
    async getPlaylist() {
      try {
        const response = await this.$axios.$get(`/playlists/${this.$auth.user.id}?page=${this.page}&limit=${this.perPages}&sort_by=${this.sortField}&sort_order=${this.sortOrder}`)
        this.playlists = response.data
      } catch (error) {
        // console.error(error)
      }
    },
    // ajout d'une musique à une playlist
    async addMusicToPlaylist(music, playlist) {
      try {
        await this.$axios.$post(`/playlists/${playlist.id}/musics/${music.id}`)
        this.$buefy.toast.open({
          message: `Music ${music.title} added to playlist ${playlist.name}`,
          type: 'is-success',
          position: 'is-top',
          duration: 5000,
        });
      } catch (error) {
        // console.error(error)
      }
    },
    // ajout d'une musique
    add() {
      this.isComponentModalActive = true
      this.showModalAdd = true
      const getMusic = this.getMusics.bind(this)
      this.$buefy.modal.open({
        parent: this,
        component: SFMusicModalFormAdd,
        trapFocus: true,
        hasModalCard: true,
        props: {
          getMusic,
        },
      })
    },
    // édition d'une musique
    edit(music) {
      const getMusic = this.getMusics.bind(this)
      this.$buefy.modal.open({
        parent: this,
        component: SFMusicModalFormEdit,
        trapFocus: true,
        hasModalCard: true,
        props: {
          music,
          getMusic,
        },
      })
    },
    // supprimer une musique
    remove(music) {
      const getMusic = this.getMusics.bind(this)
      this.$buefy.modal.open({
        parent: this,
        component: SFMusicModalFormDelete,
        trapFocus: true,
        hasModalCard: true,
        props: {
          music,
          getMusic,
        },
      })
    },
    // pagination
    onSelectPerPage(perPages) {
      this.perPages = perPages
      this.getMusics()
    },
    // changement de page
    onPageChange(page) {
      this.page = page
      this.getMusics()
    },
    // tri des colonnes
    onSort(field, order) {
      this.sortField = field
      this.sortOrder = order
      this.getMusics()
    },
  },
}
</script>

<template>
  <section class="app">
    <div class="flex flex-jc-sb m-b-10 button-responsive">
      <b-input v-model="search" v-debounce:400ms="getMusics" placeholder="Search" icon="magnify"></b-input>
      <button class="button is-success" alt="add button" @click="add()">
          <span class="icon is-small">
            <i class="mdi mdi-playlist-plus"></i>
          </span>
        <span>Add a new track</span>
      </button>
    </div>

    <b-table v-if="musics.length > 0" :data="musics" paginated backend-pagination sortable :selected.sync="selected" :total="totalCount" :per-page="perPages" :loading="loading" :hoverable="true" @page-change="onPageChange" @sort="onSort">
      <b-table-column v-for="(column, index) in columns" :key="index" v-slot="props" :field="column.field" :label="column.label" :width="column.width" :numeric="column.numeric" :centered="column.centered" :sortable="column.sortable">
        <b-tooltip :label="props.row[column.field]">
          <p class="ellipsis" :class="{'is-blocked': props.row.blocked === 'true'}">{{ props.row[column.field] }}</p>
        </b-tooltip>
      </b-table-column>

      <b-table-column v-slot="props" field="actions" label="Actions" width="200" centered>
        <div class="action">
          <b-dropdown aria-role="list" @click.native.stop>
            <template #trigger="{ active }">
              <b-button type="is-success" rounded :icon-left="active ? 'minus' : 'plus'"></b-button>
            </template>

            <b-dropdown-item
              v-for="playlist in playlists"
              :key="playlist.id"
              aria-role="listitem"
              @click="addMusicToPlaylist(props.row, playlist)"
            >
              {{ playlist.name }}
            </b-dropdown-item>
            <b-dropdown-item v-if="playlists.length === 0">
              Pas de playlists
            </b-dropdown-item>
          </b-dropdown>

          <b-button type="is-info" icon-left="pencil" alt="edit button" rounded @click.stop="edit(props.row)"></b-button>
          <b-button type="is-danger" icon-left="trash-can" alt="remove button" rounded @click.stop="remove(props.row)"></b-button>
        </div>

      </b-table-column>
      <SFTableFooter slot="bottom-left" :page="page" :per-page="perPages" :total="totalCount" @onSelect="onSelectPerPage" />
    </b-table>
    <div v-else class="text-center">
      <h1>This table is empty</h1>
    </div>
  </section>
</template>

<style scoped>
.dropdown-content {
  max-width: 150px;
  max-height: 200px;
  overflow-y: auto;
}
h1{
  font-size: 2.5rem;
  font-weight: 700;
}
[data-tooltip]:hover::after {
  content: attr(data-tooltip);
}

@media screen and (max-width: 768px) {
  .button-responsive button span:nth-child(2){
    display: none;
  }
  .button .icon:first-child:not(:last-child) {
    margin-right: 0;
    margin-left: 0;
  }
}
</style>
