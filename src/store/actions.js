import * as Github from 'github-api';

const actions = {
  updateUser ({ commit, state }, token) {
      if (!token) {
          return;
      }
      commit('UPDATE_USER_TOKEN', token);

      let gh = new Github({
         token: state.user.token
      });
      commit('UPDATE_GH_OBJECT', gh);

      gh.getUser().getProfile().then((resp) => {
          commit('UPDATE_USER', {
              id: resp.data.id,
              username: resp.data.login,
          });
      });
  },
  updateOrganizations () {

  },
};

export default actions;
