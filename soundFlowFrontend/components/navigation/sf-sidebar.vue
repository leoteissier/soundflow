<script>

</script>

<template>
  <nav class="sidebar">
    <ul>
      <li>
<!--        <nuxt-link to="/musics">Your Musics</nuxt-link>-->
        <nuxt-link to="/musics"><b-button class="icon-size" icon-left="music-box" al="your music button"/></nuxt-link>
      </li>
      <li>
        <!--        <nuxt-link to="/playlists">Your Playlists</nuxt-link>-->
        <nuxt-link to="/playlists"><b-button class="icon-size" icon-left="playlist-music" alt="yout playlist button"/></nuxt-link>
      </li>
    </ul>
  </nav>
</template>

<style lang="scss" scoped>
@import '~assets/scss/variables.scss';
.sidebar{
  height: 130px;
  grid-column: 1/2;
  grid-row: 2/3;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  z-index: 10;
  ul{
    width: 100%;
    list-style: none;
    padding: 0;
    margin: 0;
    li{
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 10px auto;
      padding: 0;
      button{
        border: #7957d5 1px solid;
      }
    }
  }
}
.icon-size{
  height: 50px;
  padding: 20px;
  font-size: 30px;
}
@media screen and (max-width: 768px) {
  .sidebar{
    grid-column: 1/2;
    grid-row: 4/5;
    height: auto;
    ul{
      display: flex;
      justify-content: space-evenly;
      li{
        margin: auto 10px;
      }
    }
  }
}
</style>
