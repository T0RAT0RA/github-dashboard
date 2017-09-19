from flask import Flask, request, g, session, redirect, url_for, jsonify
from flask import render_template
from flask_cache import Cache
from flask_marshmallow import Marshmallow
import yaml, json
from github import Github
from github3 import login

DEBUG = True

#---------------
# SETUP FLASK
#---------------
app = Flask(__name__)
app.config.from_object(__name__)
cache = Cache(app,config={'CACHE_TYPE': 'simple'})
ma = Marshmallow(cache)

#---------------
# SCHEMAS
#---------------
class LabelSchema(ma.Schema):
    name = ma.Str()
    color = ma.Str()

class RepositorySchema(ma.Schema):
    id = ma.Integer()
    full_name = ma.Str()
    name = ma.Str()
    default_branch = ma.Str()
    html_url = ma.Str()
    html_url = ma.Str()
    labels = ma.Function(lambda obj: labels_schema.dump(obj.get_labels()).data)



repository_schema = RepositorySchema()
repositories_schema = RepositorySchema(many=True)

label_schema = LabelSchema()
labels_schema = LabelSchema(many=True)

#---------------
# ROUTES
#---------------
@app.before_request
def before_request():
    username = request.headers.get('X-github-username') or \
            request.args.get('github-username')
    token = request.headers.get('X-github-token') or \
            request.args.get('github-token')
    g.github = Github(username, token)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/config')
def config():
    with open('config/webapp.yaml', 'r') as f:
        webapp = yaml.load(f)
    with open('config/jenkins.yaml', 'r') as f:
        jenkins = yaml.load(f)
    return jsonify({
        'jenkins': jenkins,
        'webapp': webapp
    })

@app.route('/user')
def user():
    user = g.github.get_user()
    return jsonify({
        "id": user.id,
        "username": user.login,
    })

@app.route('/repository/<repository>')
def repository(repository):
    repo = g.github.get_organization('AlayaCare').get_repo(repository)
    result = repository_schema.dump(repo)
    return jsonify(result.data)

@app.route('/repositories')
@cache.cached(timeout=3600, key_prefix='repositories')
def repositories():
    #repos = g.github.get_organization('AlayaCare').get_repos()
    repos = [
        g.github.get_organization('AlayaCare').get_repo('php-config'),
        g.github.get_organization('AlayaCare').get_repo('webapp'),
        g.github.get_organization('AlayaCare').get_repo('TrackTikCloud'),
        g.github.get_organization('AlayaCare').get_repo('api.files'),
        g.github.get_organization('AlayaCare').get_repo('api.scheduler')
    ]

    result = repositories_schema.dump(repos)
    return jsonify(result.data)

@app.route('/set/default-branch')
def set_default_branch():
    repository = request.args.get('repository')
    default_branch = request.args.get('default-branch')
    repo = g.github.get_organization('AlayaCare').get_repo(repository)
    edit = repo.edit(default_branch=default_branch)

    result = repository_schema.dump(repo)
    return jsonify(result.data)

@app.route('/set/labels', methods=['PUT'])
def set_labels():
    repo = g.github.get_organization('AlayaCare').get_repo(request.json['repository'])
    repo_labels = repo.get_labels()
    labels_to_update = {x['name']: x for x in request.json['labels']}

    for label in repo_labels:
        #Delete labels not in config:
        if label.name not in labels_to_update:
            #TODO: warning
            #label.delete()
            pass

        #Update labels in config:
        if label.name in labels_to_update:
            label_to_update = labels_to_update.pop(label.name)
            label.edit(label_to_update['name'], label_to_update['color'])

    #Create labels in config:
    if labels_to_update:
        for name, label in labels_to_update.items():
            repo.create_label(label['name'], label['color'])

    result = repository_schema.dump(repo)
    return jsonify(result.data)


if __name__ == '__main__':
    app.run(debug=True)
