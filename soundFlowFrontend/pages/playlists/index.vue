<script>
import { saveAs } from 'file-saver'
import SFTableFooter from '~/components/table/sf-table-footer.vue'
import SFPlaylistModalFormAdd from '~/components/playlists/sf-playlist-form-add.vue'
import SFPlaylistModalFormEdit from '~/components/playlists/sf-playlist-form-edit.vue'
import SFPlaylistModalFormDelete from '~/components/playlists/sf-playlist-form-delete.vue'
export default {
  components: { SFTableFooter },
  auth: true,
  data() {
    const playlists = []
    return {
      playlists,
      selected: playlists[1],
      columns: [
        // { field: 'id', label: 'ID', width: '40', numeric: true, centered: true, sortable: true, },
        { field: 'name', label: 'Name', sortable: true },
        { field: 'nbMusic', label: 'Number of track', centered: true, sortable: true },
        { field: 'duration', label: 'Duration', centered: true, sortable: true },
      ],
      nbmusic: null,
      // pagination
      sortOrder: 'asc', // initial sort order
      sortField: 'id', // initial sort field
      totalPages: 0, // initial le nombre de pages
      totalCount: 0, // initial le nombre de musiques
      page: 1, // initial page
      perPages: 10, // initial rows per page
      // filtre
      search: '',
      // options
      loading: true,
    }
  },
  watch: {
    selected(row) {
      if (row && row.id) {
        this.$router.push(`/playlists/${row.id}`);
      }
    },
  },
  mounted() {
    this.getPlaylist()
  },
  methods: {
    // récupération des données
    async getPlaylist() {
      try {
        this.loading = true
        const response = await this.$axios.$get(`/playlists/${this.$auth.user.id}?page=${this.page}&limit=${this.perPages}&name=${this.search}&sort_by=${this.sortField}&sort_order=${this.sortOrder}`)
        this.playlists = response.data
        this.totalCount = response.totalCount
      } catch (error) {
        // console.error(error)
      } finally {
        this.loading = false
      }
    },
    // ajouter une playlist
    add() {
      const getPlaylist = this.getPlaylist.bind(this)
      this.$buefy.modal.open({
        parent: this,
        component: SFPlaylistModalFormAdd,
        trapFocus: true,
        hasModalCard: true,
        props: {
          getPlaylist,
        },
      })
    },
    // éditer une playlist
    edit(playlist) {
      const getPlaylist = this.getPlaylist.bind(this)
      this.$buefy.modal.open({
        parent: this,
        component: SFPlaylistModalFormEdit,
        trapFocus: true,
        hasModalCard: true,
        props: {
          playlist,
          getPlaylist,
        },
      })
    },
    // supprimer une playlist
    remove(playlist) {
      const getPlaylist = this.getPlaylist.bind(this)
      this.$buefy.modal.open({
        parent: this,
        component: SFPlaylistModalFormDelete,
        trapFocus: true,
        hasModalCard: true,
        props: {
          playlist,
          getPlaylist,
        },
      })
    },
    // exporter une playlist
    exportPlaylist(id, name) {
      try {
        this.$axios.$get(`/playlists/${id}/export`)
          .then(response => {
            let m3uContent = '#EXTM3U\n\n';
            m3uContent += `#PLAYLIST:${name}\n`
            response.forEach(file => {
              const duration = file.duration
              const minutes = Math.floor(duration / 60)
              const seconds = duration % 60
              const formattedDuration = minutes * 60 + seconds;

              m3uContent += `#EXTINF:${formattedDuration},${file.artist} - ${file.title}\n`;
              m3uContent += `#EXTALB:${file.album}\n`; // for album
              m3uContent += `#EXTGENRE:${file.style}\n`; // for style
              m3uContent += `${file.link}\n`;
            });
            const blob = new Blob([m3uContent], { type: 'audio/x-mpegurl' });
            saveAs(blob, `${name}.m3u`);
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
    // pagination
    onSelectPerPage(perPages) {
      this.perPages = perPages
      this.getPlaylist()
    },
    // changement de page
    onPageChange(page) {
      this.page = page
      this.getPlaylist()
    },
    // tri des colonnes
    onSort(field, order) {
      this.sortField = field
      this.sortOrder = order
      this.getPlaylist()
    },
  },
}
</script>

<template>
  <section class="app">
    <div class="flex flex-jc-sb m-b-10 button-responsive">
      <b-input v-model="search" v-debounce:400ms="getPlaylist" placeholder="Search" icon="magnify"></b-input>
      <button class="button is-success" alt="add button" @click="add()">
          <span class="icon is-small">
            <i class="mdi mdi-playlist-plus"></i>
          </span>
        <span>Create a new playlists</span>
      </button>
    </div>

    <b-table v-if="playlists.length > 0" class="table-cursor" :data="playlists" paginated backend-pagination sortable backend-sorting :selected.sync="selected" :total="totalCount" :per-page="perPages" :loading="loading" :hoverable="true" @page-change="onPageChange" @sort="onSort">
      <b-table-column  v-for="(column, index) in columns" :key="index" v-slot="props" :field="column.field" :label="column.label" :width="column.width" :numeric="column.numeric" :centered="column.centered">
        <b-tooltip :label="props.row[column.field]">
          <p class="ellipsis">{{ props.row[column.field] }}</p>
        </b-tooltip>
      </b-table-column>

      <b-table-column v-slot="props" label="Actions" width="200" centered>
        <div class="action">
          <b-button type="is-info" icon-left="pencil" alt="edit button" rounded @click.stop="edit(props.row)"></b-button>
          <b-button type="is-danger" icon-left="trash-can" alt="remove button" rounded @click.stop="remove(props.row)"></b-button>
          <b-button type="is-success" icon-left="export" alt="export button" rounded @click.stop="exportPlaylist(props.row.id, props.row.name)"></b-button>
        </div>
      </b-table-column>

      <SFTableFooter slot="bottom-left" :page="page" :per-page="perPages" :total="totalCount" @onSelect="onSelectPerPage" />
    </b-table>
    <div v-else class="text-center">
      <h1>This table is empty</h1>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
}
.current-page {
  display: inline-block;
  margin: 0 10px;
  font-size: 16px;
  font-weight: bold;
}
h1{
  font-size: 2.5rem;
  font-weight: 700;
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
