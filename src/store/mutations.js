const mutations = {
  UPDATE_USER_TOKEN (state, token) {
    state.user.token = token;
  },

  UPDATE_USER (state, user) {
    state.user = {
        ...state.user,
        id: user.id,
        username: user.username
    };
  },

  LOGOUT_USER (state) {
    state.user = {
        id: null,
        token: '',
        login: null,
    };
  },

  UPDATE_GH_OBJECT (state, gh) {
    state.gh = gh;
  },

  UPDATE_CONFIG (state, config) {
    state.config = Object.assign({}, state.config, config);
  }
}

export default mutations;
