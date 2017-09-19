<template>
<div>
    <nav class="navbar navbar-inverse navbar-fixed-top">
        <div class="container-fluid">
            <div class="navbar-header">
                <a class="navbar-brand" href="#">Github Dashboard</a>
            </div>

        <div class="collapse navbar-collapse">
          <form class="navbar-form navbar-right">
            <div class="form-group has-feedback"
                 :class="{'has-error': token_input && !isTokenValid}"
                 v-if="!$store.state.user.username">
              <input type="text" v-model="token_input" class="form-control" placeholder="github token">
              <span v-if="token_input && !isTokenValid"
                    class="glyphicon glyphicon-remove form-control-feedback"></span>
            </div>
          </form>
          <ul class="nav navbar-nav navbar-right">
            <li v-if="$store.state.user.username && rate.limit">
                <p class="navbar-text">Rate Limit: {{rate.remaining}}/{{rate.limit}}
                    <i class="fa fa-refresh" aria-hidden="true" @click="getRateLimit"
                       :class="{ 'fa-pulse': loading.rate }"></i>
                </p>
            </li>
            <li class="dropdown" v-if="$store.state.user.username">
              <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
                  {{ $store.state.user.username }}
                  <span class="caret"></span>
              </a>
              <ul class="dropdown-menu">
                <li><a href="https://github.com/settings/tokens">Github tokens</a></li>
                <li><a href="#" @click="logout">Logout</a></li>
              </ul>
            </li>
          </ul>
        </div><!-- /.navbar-collapse -->
      </div><!-- /.container-fluid -->
    </nav>
    <div class="container-fluid">

        <div class="row">
            <div class="col-md-3">
                <repositoryConfiguration />
            </div>

            <div class="col-md-9">
                <div class="panel panel-default repositories">
                  <div class="panel-heading">
                    <div class="panel-title filters">
                        <div>
                            <span>
                                <select v-model="selectedOrganization">
                                    <option val="" selected>Organizations</option>
                                    <option :val="org.login" v-for="org in organizations">{{org.login}}</option>
                                </select>
                            </span>
                            <span><input v-model="repositorySearch" placeholder="Filter repositories"/></span>
                            <span v-if="loading.repositories">
                                <i class="fa fa-spinner fa-pulse"></i>
                            </span>
                            <span v-if="statusMessage">{{statusMessage}}</span>
                        </div>
                        <div>
                            <span>Repositories: </span>
                            <span :class="{selected: visibility == 'all'}"
                                @click="visibility = 'all'">
                                Total: {{Object.keys(this.repositories).length}} -
                            </span>
                            <span :class="{selected: visibility == 'matching'}"
                                @click="visibility = 'matching'">
                                Matching: {{Object.values(this.matchingConfigRepositories).length}} -
                            </span>
                            <span :class="{selected: visibility == 'valid'}"
                                @click="visibility = 'valid'">
                                Valid: {{Object.values(this.validRepositories).length}} -
                            </span>
                            <span :class="{selected: visibility == 'invalid'}"
                                @click="visibility = 'invalid'">
                                Invalid: {{Object.values(this.invalidRepositories).length}}
                            </span>
                        </div>
                    </div>
                  </div>
                  <div class="panel-body" v-if="!Object.keys(this.repositories).length">
                      No repository.
                  </div>
                  <div class="panel-body" v-if="Object.keys(this.repositories).length">
                      <table class="table table-striped table-hover table-condensed">
                          <thead>
                              <tr>
                                  <th class="col-md-3">Repository</th>
                                  <th class="col-md-1 text-center">Valid</th>
                                  <th class="col-md-1 text-center">Default branch</th>
                                  <th class="col-md-2 text-center">Protected Branches</th>
                                  <th class="col-md-3 text-center">Labels</th>
                                  <th></th>
                              </tr>
                          </thead>
                          <tbody>
                              <tr v-for="repository in filteredRepositories"
                              class="text-center"
                                  :class="{
                                    'success': !repository.loading && repository.isValid
                                  }">
                                  <td class="text-left">
                                      <a :href="repository.html_url">{{repository.full_name}}</a>
                                  </td>
                                  <td class="status text-center"
                                      :class="{
                                        'success': !repository.loading && repository.isValid,
                                        'danger': !repository.loading && !repository.isValid,
                                      }">
                                      <span v-if="!repository.loading && repository.isValid" class="glyphicon glyphicon-ok" aria-hidden="true"></span>
                                      <span v-if="!repository.loading && !repository.isValid" class="glyphicon glyphicon-remove" aria-hidden="true"></span>
                                      <span v-if="repository.loading">
                                          <i class="fa fa-spinner fa-pulse"></i>
                                      </span>
                                  </td>
                                  <td :class="{
                                        'success': repository.validations.default_branch,
                                        'danger': !repository.validations.default_branch,
                                      }">
                                      <a :href="repository.html_url + '/settings/branches'">{{repository.default_branch}}</a>
                                  </td>
                                  <td class="protected-branches"
                                      :class="{
                                        'success': repository.validations.protected_branches,
                                        'danger': !repository.validations.protected_branches,
                                      }">
                                      <span v-for="(protection, branch) in repository.protected_branches"
                                        >{{branch}}</span>
                                  </td>
                                  <td :class="{
                                        'success': repository.validations.labels,
                                        'danger': !repository.validations.labels,
                                      }">
                                      <a
                                        :href="repository.html_url + '/labels'"
                                        v-if="repository.labels && repository.labels.length"
                                            :title="repository.labels.map((l) => l.name).join(', ')">
                                          {{repository.labels.length}} Labels
                                      </a>

                                      <!-- <span class="label" v-for="label in repository.labels" :style="labelStyle(label)">
                                          {{label.name}}
                                      </span> -->
                                  </td>
                                  <td class="tools">
                                      <button class="btn btn-sm btn-primary pull-right" @click="reloadRepository(repository)">
                                          <i class="fa fa-refresh"
                                              aria-hidden="true"
                                              :class="{ 'fa-pulse': repository.loading }"></i>
                                      </button>
                                      <button v-if="!repository.loading && !repository.isValid"
                                              class="btn btn-sm btn-danger pull-right"
                                              @click="fixRepository(repository)">
                                          FIX ME
                                      </button>
                                  </td>
                              </tr>
                          </tbody>
                      </table>
                  </div>
                </div>
            </div>
        </div>

    </div>
    </div>
</template>

<script>
var request = require('superagent');
import * as Github from 'github-api';
var _ = require('lodash');
import repositoryConfiguration from './RepositoryConfiguration.vue';

export default {
    components: {
        repositoryConfiguration,
    },
    data() {
        return {
            token_input: this.$store.state.user.token,
            rate: {
                limit: null,
                remaining: null,
                reset: null,
            },
            selectedOrganization: null,
            organizations: {},
            repositories: {},
            repositorySearch: '',
            statusMessage: '',
            visibility: 'matching',
            config: null,
            loading: {
                rate: false,
                organizations: false,
                repositories: false,
                repo: {},
            },
        }
    },
    created: function() {
        this.updateUser();
    },
    watch: {
        token_input: function() {
            if (!this.token_input) {
                this.logout();
            } else {
                this.updateUser();
            }
        },
        user: function() {
            if (!this.user.username) {
                return;
            }
            this.updateOrganizations();
        },
        selectedOrganization: function(val) {
            if (!val) {
                this.repositories = {};
                return;
            }
            this.updateRepositories();
        }
    },
    computed: {
        user: function() {
            if (!this.isTokenValid) {
                return;
            }
            return this.$store.state.user;
        },
        isTokenValid: function() {
            return (
                this.$store.state.user.token.length > 0
                && this.$store.state.user
                && this.$store.state.user.id
            );
        },
        matchingSearchRepositories: function() {
            return _.filter(this.repositories, (repo) => {
                if (!this.repositorySearch || new RegExp(this.repositorySearch).test(repo.name)) {
                    return true;
                }
                return false;
            });
        },
        matchingConfigRepositories: function() {
            return _.filter(this.matchingSearchRepositories, (repo) => {
                for (let r of this.$store.state.config.repositories) {
                    if (new RegExp("^" + r.split("*").join(".*") + "$").test(repo.name)) {
                        return true;
                    }
                }
                return false;
            });
        },
        validRepositories: function() {
            return _.filter(this.matchingConfigRepositories, (r) => { return r.isValid; });
        },
        invalidRepositories: function() {
            return _.filter(this.matchingConfigRepositories, (r) => { return !r.isValid; });
        },
        filteredRepositories: function() {
            if (this.visibility == 'all') {
                return this.matchingSearchRepositories;
            }
            if (this.visibility == 'valid') {
                return this.validRepositories;
            }
            if (this.visibility == 'invalid') {
                return this.invalidRepositories;
            }
            if (this.visibility == 'matching') {
                return this.matchingConfigRepositories;
            }
        }
    },
    methods: {
        updateUser: function() {
            this.$store.dispatch('updateUser', this.token_input);
        },
        logout: function() {
            this.token_input = '';
            this.$store.commit('LOGOUT_USER');
        },
        getRateLimit: function() {
            this.loading.rate = true;
            this.$store.state.gh.getRateLimit().getRateLimit().then((resp) => {
                this.rate = resp.data.resources.core;
                setTimeout(() => this.loading.rate = false, 500);
            })
        },
        updateOrganizations: function() {
            this.loading.organizations = true;
            this.$store.state.gh.getUser().listOrgs().then((resp) => {
                this.organizations = resp.data.reduce((orgs, o) => {
                    orgs[o.id] = {
                        id: o.id,
                        login: o.login,
                    };
                    return orgs;
                }, {});
                this.loading.organizations = false;
                this.getRateLimit();
            })
        },
        updateRepositories: function() {
            let self = this;
            this.loading.repositories = true;
            this.statusMessage = '';
            let promises = [];
            this.$store.state.gh
                .getOrganization(this.selectedOrganization)
                .getRepos()
                .then((resp) => {
                    self.repositories = resp.data.reduce((repos, r) => {
                        r.loading = true;
                        r.labels = [];
                        r.protected_branches = {};
                        this.validateRepository(r);
                        repos[r.id] = r;

                        promises.push(
                            Promise.all([
                                this.updateRepositoryLabels(r),
                                this.updateRepositoryBranchProtection(r),
                            ]).then((resp) => {
                                r.loading = false;
                            })
                        );

                        return repos;
                    }, {});

                    Promise.all(promises)
                        .then(data => {
                            self.loading.repositories = false;
                            this.getRateLimit();
                        });
                })
                .catch((resp) => {
                    self.loading.repositories = false;
                    this.statusMessage = resp.message;
                });
        },
        reloadRepository: function(repository) {
            repository.loading = true;

            this.$store.state.gh
                .getRepo(this.selectedOrganization, repository.name)
                .getDetails()
                .then((resp) => {
                    let r = resp.data;
                    r.loading = true;
                    r.labels = [];
                    r.protected_branches = {};
                    this.validateRepository(r);
                    this.repositories[r.id] = r;

                    Promise.all([
                        this.updateRepositoryLabels(r),
                        this.updateRepositoryBranchProtection(r),
                    ]).then(() => {
                        this.validateRepository(r);
                        r.loading = false;
                        this.getRateLimit();
                    });
                });
        },
        updateRepositoryLabels: function(repository) {
            return this.$store.state.gh.getIssues(this.selectedOrganization, repository.name)
                .listLabels()
                .then((resp) => {
                    repository.labels = resp.data;
                    this.validateRepository(repository);
                })
        },
        updateRepositoryBranchProtection: function(repository) {
            return new Promise((resolve, reject) => {
                this.$store.state.gh.getRepo(this.selectedOrganization, repository.name)
                    .listBranches({protected: true})
                    .then((resp) => {
                        repository.protected_branches = {};
                        Promise.all(resp.data.map((branch) => {
                            return this.$store.state.gh.getRepo(this.selectedOrganization, repository.name)
                                .getBranchProtection(branch.name)
                                .then((resp) => {
                                    repository.protected_branches[branch.name] = resp.data;
                                });
                        })).then(() => {
                            this.validateRepository(repository);
                            resolve();
                        });
                    })
            });
        },
        validateRepositories: function() {
             _.filter(this.repositories, (repo) => {
                this.validateRepository(repo);
            });
        },
        validateRepository: function(repository) {
                repository.validations = {
                   default_branch: repository.default_branch == this.$store.state.config.default_branch,
                   labels: repository.labels?
                        _.isEqual(_.map(this.$store.state.config.labels, (l) => _.pick(l, ['name', 'color'])), _.map(repository.labels, (l) => _.pick(l, ['name', 'color']))) : false,
                    protected_branches: true,
                };
                repository.isValid = !Object.values(repository.validations).filter((v) => { return !v; }).length >= 1
        },
        labelStyle: function(label) {
            return {
                "color": this.getContrastColor(label.color),
                "background-color": '#'+label.color,
                "border-color": (label.color == 'ffffff')? '#eee' : 'none'
            }
        },
        getContrastColor: function(hexcolor) {
            var r = parseInt(hexcolor.substr(0,2),16);
            var g = parseInt(hexcolor.substr(2,2),16);
            var b = parseInt(hexcolor.substr(4,2),16);
            var yiq = ((r*299)+(g*587)+(b*114))/1000;
            return (yiq >= 128) ? '#333333' : '#FFF';
        },
        fixRepository: function(repository) {
            repository.loading = true;
            Promise.all([
                this.fixDefaultBranch(repository),
                this.fixLabels(repository),
            ]).then(() => {
                repository.loading = false;
                this.getRateLimit();
            });
        },
        fixDefaultBranch: function(repository) {
            //Do not fix default branch if valid
            if (repository.validations.default_branch) {
                return Promise.resolve();
            }
            return this.$store.state.gh
                .getRepo(this.selectedOrganization, repository.name)
                .updateRepository({
                    name: repository.name,
                    default_branch: this.$store.state.config.default_branch
                }).then((resp) => {
                    repository.default_branch = resp.data.default_branch;
                    this.validateRepository(repository);
                })
        },
        fixLabels: function(repository) {
            //Do not fix labels if valid
            if (repository.validations.labels) {
                return Promise.resolve();
            }

            let promises = [];
            let configLabels = this.$store.state.config.labels.reduce((o, l) => { o[l.name] = l.color; return o;}, {});
            let repoLabels = repository.labels.reduce((o, l) => { o[l.name] = l.color; return o;}, {});

            let labelUpdates = {
                'create': [],
                'update': [],
                'delete': [],
            };

            Object.keys(configLabels).reduce((o, name) => {
                let color = configLabels[name];
                if(!(name in repoLabels)) {
                    o['create'].push({
                        name: name,
                        color: color,
                    });
                } else if(repoLabels[name] !== color) {
                    o['update'].push({
                        name: name,
                        color: color,
                    });
                };
                return o;
            }, labelUpdates)

            Object.keys(repoLabels).reduce((o, name) => {
                if(!(name in configLabels)) {
                    o['delete'].push({
                        name: name,
                    });
                }
                return o;
            }, labelUpdates)
            console.log('Labels to update:', labelUpdates);

            //To update
            labelUpdates['update'].map((label) => {
                    promises.push(
                        this.$store.state.gh.getIssues(this.selectedOrganization, repository.name)
                            .editLabel(label.name, {
                                'name': label.name,
                                'color': label.color,
                            })
                    );
                });

            //To Create
            labelUpdates['create'].map((label) => {
                    promises.push(
                        this.$store.state.gh.getIssues(this.selectedOrganization, repository.name)
                            .createLabel({
                                'name': label.name,
                                'color': label.color,
                            })
                    );
                });;

            //To Delete
            labelUpdates['delete'].map((label) => {
                    promises.push(
                        this.$store.state.gh.getIssues(this.selectedOrganization, repository.name)
                            .deleteLabel(label.name)
                    );
                });;


            ;

            return new Promise((resolve, reject) => {
                Promise.all(promises).then(() => {
                   this.updateRepositoryLabels(repository).then(() => {
                       this.validateRepository(repository);
                       resolve();
                   });
               });
           });
        },
    }
}
</script>

<style lang="less" rel="stylesheet/less">
.label {
    margin: 0 2px;
    display: inline-block;
    white-space: nowrap;
}
.filters {
    span.selected {
        font-weight: bold;
    }
}
.repositories {
    .status {
        .glyphicon-ok { color: #080; }
        .glyphicon-remove { color: #800; }
    }
    .tools {
        button { margin-right: 1px; padding: 0px 5px; }
    }
    .protected-branches {
        span:after { content: ", "; }
        span:last-child:after { content: ""; }
    }

}
</style>
