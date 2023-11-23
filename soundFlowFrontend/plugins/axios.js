export default (context, inject) => {
  context.app.$axios.interceptors.request.use((config) => {
    config.baseURL = context.app.$env.API_URL
    return config
  })
}
