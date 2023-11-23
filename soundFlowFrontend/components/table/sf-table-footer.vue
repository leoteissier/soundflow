<template>
  <b-field grouped>
    <b-select :value="perPage" @input="onSelect">
      <option v-for="value in options" :key="value" :value="value">
        {{ value }} per page
      </option>
    </b-select>
    <span class="control info-table is-flex is-align-items-center">
      display {{ showingFrom }} -
      {{ showingTo }} on
      {{ total }}
    </span>
  </b-field>
</template>

<script>
export default {
  props: {
    page: {
      type: Number,
      required: true,
    },
    perPage: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      options: [10, 25, 50],
    }
  },
  computed: {
    showingFrom() {
      return (this.page - 1) * this.perPage + 1
    },
    showingTo() {
      const nbItems = (this.page - 1) * this.perPage + parseInt(this.perPage)
      if (nbItems > this.total) {
        return this.total
      } else {
        return nbItems
      }
    },
  },
  methods: {
    onSelect(value) {
      this.$emit('onSelect', value)
    },
  },
}
</script>

<style scoped>
</style>
