var app = new Vue({
    el: '#app',
    delimiters: ['${', '}'],
    data: {
        token: '',
        username: '',
        user: null,
        configs: [],
        selectedConfig: null,
        repositories: {},
        visibility: 'all',
        loading: {
            configs: false,
            repositories: false,
            repo: {},
        },
    },
    created: function() {
        this.updateUser();
        this.updateConfig();
    },
    watch: {
        token: function() {
            this.updateUser();
        },
        user: function() {
            this.updateUser();
        }
    },
    computed: {
        isTokenValid: function() {
            return (this.token.length > 0 && this.user && this.user.id);
        },
        config: function() {
            if (!this.configs || !this.selectedConfig) {
                return {};
            }

            return this.configs[this.selectedConfig];
        },
        validRepositories: function() {
            return _.filter(this.repositories, (r) => { return r.isValid; });
        },
        invalidRepositories: function() {
            return _.filter(this.repositories, (r) => { return !r.isValid; });
        },
        filteredRepositories: function() {
            repositories = this.repositories;
            if (this.visibility == 'valid') {
                repositories = this.validRepositories;
            }
            if (this.visibility == 'invalid') {
                repositories = this.invalidRepositories;
            }

            return  _.filter(repositories, (repo) => {
                for (r of this.config.repositories) {
                    if (new RegExp("^" + r.split("*").join(".*") + "$").test(repo.name)) {
                        return true;
                    }
                }
                return false;
            });
        }
    },
    methods: {
        updateVisibility: function(visibility) {
            this.visibility = visibility;
        },
        updateUser: _.debounce(function () {
            if (!this.token) { return; }
            superagent.get('/user')
               .set('X-github-token', this.token)
               .set('X-github-username', this.username)
               .end((err, res) => {
                    this.user = res.body;
                });
        }, 500),
        updateRepositories: function() {
            this.loading.repositories = true;
            superagent.get('/repositories')
               .set('X-github-token', this.token)
               .set('X-github-username', this.username)
               .end((err, res) => {
                    this.repositories = res.body.reduce((repos, r) => {
                        repos[r.id] = r;
                        return repos;
                    }, {});
                    this.validateRepositories();
                    this.loading.repositories = false;
                });
        },
        updateConfig: function() {
            this.loading.configs = true;
            superagent.get('/config')
               .end((err, res) => {
                    this.configs = res.body;
                    this.selectedConfig = Object.keys(this.configs)[0];
                    this.loading.configs = false;
                });
        },
        validateRepositories: function() {
             _.filter(this.repositories, (repo) => {
                repo.validations = {
                    default_branch: repo.default_branch == this.config.default_branch,
                    labels: _.isEqual(this.config.labels, repo.labels)
                };

                repo.isValid = !Object.values(repo.validations).filter((v) => { return !v; }).length >= 1
            });
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

        reloadRepository: function(repository) {
            this.loading.repo = Object.assign({}, this.loading.repo, {[repository.id]: true});
            superagent.get('/repository/'+repository.name)
                .set('X-github-token', this.token)
                .set('X-github-username', this.username)
                .end((err, res) => {
                    this.repositories[res.body.id] = res.body;
                    this.validateRepositories();
                    this.loading.repo[repository.id] = false;
                });
        },

        setDefaultBranch: function(repository) {
            this.loading.repo = Object.assign({}, this.loading.repo, {[repository.id]: true});
            superagent.get('/set/default-branch')
                .set('X-github-token', this.token)
                .set('X-github-username', this.username)
                .query({
                    'repository': repository.name,
                    'default-branch': this.config.default_branch
                })
                .end((err, res) => {
                    this.repositories[res.body.id] = res.body;
                    this.validateRepositories();
                    this.loading.repo[repository.id] = false;
                });
        },

        setLabels: function(repository) {
            this.loading.repo = Object.assign({}, this.loading.repo, {[repository.id]: true});
            superagent.put('/set/labels')
                .set('X-github-token', this.token)
                .set('X-github-username', this.username)
                .send({
                    repository: repository.name,
                    labels: this.config.labels
                })
                .end((err, res) => {
                    this.repositories[res.body.id] = res.body;
                    this.validateRepositories();
                    this.loading.repo[repository.id] = false;
                });
        },
    }
})
