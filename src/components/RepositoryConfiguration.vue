<template>
    <div class="panel panel-default">
      <div class="panel-heading">
        <h3 class="panel-title">
            Configuration -
            <select v-model="selectedConfig">
                <option val="">-</option>
                <option :val="name" v-for="(val, name) in configs">{{name}}</option>
            </select>
        </h3>
      </div>
      <div class="panel-body" v-if="!config">
          No configuration selected.
      </div>
      <div class="panel-body" v-if="config">
        <div>
            Repositories:
            <ul>
                <li v-for="repo in config.repositories">{{repo}}</li>
            </ul>
        </div>
        <div>
            Default branch: {{config.default_branch}}
        </div>
        <div>
            Protected branches:
            <ul>
                <li v-for="branch in config.protected_branches">{{branch}}</li>
            </ul>
        </div>
        <div>
            Protection policy:
            <ul>
                <li v-for="(val, key) in config.protection">{{key}}: {{val}}</li>
            </ul>
        </div>
        <div class="labels">
            Labels: <br/>
            <div class="label" v-for="label in config.labels" :style="labelStyle(label)">
                {{label.name}}
            </div>
        </div>
      </div>
    </div>
</template>

<script>
var webapp = require("json-loader!yaml-loader!@/../config/templates/example.yml");

export default {
    data() {
        return {
            configs: [],
            selectedConfig: null,
        }
    },
    created: function() {
        this.configs = {
            webapp,
        };
        this.selectedConfig = Object.keys(this.configs)[0];
    },
    watch: {
        config: function() {
            this.$store.commit('UPDATE_CONFIG', this.config);
        },
    },
    computed: {
        config: function() {
            if (!this.configs || !this.selectedConfig) {
                return null;
            }

            return this.configs[this.selectedConfig];
        },
    },
    methods: {
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
