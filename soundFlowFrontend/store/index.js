export const state = () => ({
  music: [],
  isPlaying: false,
  musicList: [], // Ajout de la liste de musiques
  musicIndex: 0, // Ajout de l'index de la musique en cours de lecture
  isRepeat: false, // Ajout de l'état de répétition
});

export const mutations = {
  setMusic(state, music) {
    state.music = music;
  },
  setIsPlaying(state, isPlaying) {
    state.isPlaying = isPlaying;
  },
  setMusicList(state, musicList) { // Mutation pour mettre à jour la liste de musiques
    state.musicList = musicList;
  },
  setMusicIndex(state, index) { // Mutation pour mettre à jour l'index de la musique en cours de lecture
    state.musicIndex = index;
  },
  setIsRepeat(state, isRepeat) { // Mutation pour mettre à jour l'état de répétition
    state.isRepeat = isRepeat;
  },
};

export const getters = {
  music: state => state.music,
  isPlaying: state => state.isPlaying,
  musicList: state => state.musicList, // Getter pour accéder à la liste de musiques
  musicIndex: state => state.musicIndex, // Getter pour accéder à l'index de la musique en cours de lecture
  isRepeat: state => state.isRepeat, // Getter pour accéder à l'état de répétition
};

export const strict = false;
