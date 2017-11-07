<template>
    <div class="panel panel-default">
      <div class="panel-heading">
        <h3 class="panel-title">
            Configuration -
            <select v-model="selectedConfig"
                v-if="!editing">
                <option val="">-</option>
                <option :val="name" v-for="(val, name) in configs">{{name}}</option>
            </select>
            <input v-if="editing"
                    v-model="editableConfig.name"
                    size="10"
                    autofocus/>
            <button class="btn btn-sm btn-primary"
                    v-if="!editing"
                    @click="editConfig">
                <i class="glyphicon glyphicon-pencil"></i>
            </button>
            <button class="btn btn-sm btn-primary"
                    v-if="editing"
                    @click="saveConfig">
                <i class="glyphicon glyphicon-ok"></i>
            </button>
            <button class="btn btn-sm btn-danger pull-right"
                    v-if="editing"
                    @click="editing = !editing">
                <i class="glyphicon glyphicon-remove"></i>
            </button>
            <button class="btn btn-sm btn-success pull-right"
                    v-if="!editing">
                    <i class="glyphicon glyphicon-plus"></i>
            </button>
        </h3>
      </div>
      <div class="panel-body" v-if="!config">
          No configuration selected.
      </div>
      <div class="panel-body" v-if="config">
        <div>
            Repositories:
            <ul>
                <li v-for="repo in config.repositories">
                    {{repo}}
                    <i class="glyphicon glyphicon-remove"
                        v-if="editing"
                        @click="deleteRepo"></i>
                </li>
                <li v-if="editing">
                    <input placeholder="Add a repository">
                    <button class="btn btn-sm btn-primary"
                            @click="addRepo">
                        <i class="glyphicon glyphicon-ok"></i>
                    </button>
                </li>
            </ul>
        </div>
        <div>
            Default branch:
            <span v-if="!editing">{{config.default_branch}}</span>
            <input v-if="editing" placeholder="Default branch">
        </div>
        <div>
            Protected branches:
            <ul>
                <li v-for="branch in config.protected_branches">
                    {{branch}}
                    <i class="glyphicon glyphicon-remove"
                        v-if="editing"
                        @click="deleteRepo"></i>
                </li>
                <li v-if="editing">
                    <input placeholder="Add a repository">
                    <button class="btn btn-sm btn-primary"
                            @click="addRepo">
                        <i class="glyphicon glyphicon-ok"></i>
                    </button>
                </li>
            </ul>
        </div>
        <div>
            Protection policy:
            <ul>
                <li v-for="(val, key) in config.protection">
                    {{key}}: {{val}}
                    <i class="glyphicon glyphicon-remove"
                        v-if="editing"
                        @click="deleteRepo"></i>
                </li>
                <li v-if="editing">
                    <select>
                        <option val=""></option>
                        <option
                            :val="name" v-for="(val, name) in $store.state.protection_policies"
                            v-model="selectedPolicy"
                        >{{name}}</option>
                    </select>
                    <input type="checkbox">
                    <button class="btn btn-sm btn-primary"
                            @click="addRepo">
                        <i class="glyphicon glyphicon-ok"></i>
                    </button>
                </li>
            </ul>
        </div>
        <div class="labels">
            Labels: <br/>
            <div class="label" v-for="label in config.labels" :style="labelStyle(label)">
                {{label.name}}
                <i class="glyphicon glyphicon-remove"
                    v-if="editing"
                    @click="deleteRepo"></i>
            </div>
        </div>
      </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            selectedConfig: null,
            editing: false,
            editableConfig: {},
            selectedPolicy: null,
        }
    },
    created: function() {
        this.selectedConfig = Object.keys(this.configs)[0];
    },
    watch: {
        config: function() {
            this.$store.commit('UPDATE_CONFIG', this.config);
        },
    },
    computed: {
        configs: function() {
            return this.$store.state.configs;
        },
        config: function() {
            if (this.editing) {
                return this.editableConfig;
            }

            if (!this.configs || !this.selectedConfig) {
                return null;
            }

            return this.configs[this.selectedConfig];
        },
    },
    methods: {
        editConfig: function() {
            this.editableConfig = this.config;
            this.editableConfig.name = this.selectedConfig;
            this.editing = true;
        },
        saveConfig: function() {
            if (this.editableConfig.name != this.selectedConfig) {
                //TODO: use mutations
                this.$store.state.configs[this.editableConfig.name] = this.editableConfig;
                delete this.$store.state.configs[this.selectedConfig];
                this.selectedConfig = this.editableConfig.name;

            }
            this.editing = false;
        },
        addRepo: function() {

        },
        deleteRepo: function() {

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
    }
}
</script>

<style lang="less" rel="stylesheet/less" scoped>
.label {
    margin: 0 2px;
    display: inline-block;
    white-space: nowrap;
}
</style>
