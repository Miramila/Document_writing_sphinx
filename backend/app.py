from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from docutils.core import publish_string

app = Flask(__name__, static_folder='static', static_url_path='/')
CORS(app)  # Enable CORS

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/add-title', methods=['POST'])
def add_title():
    data = request.json
    title = data['title']
    rst_title = f"{title}\n{'=' * len(title)}\n"
    return jsonify({'rst': rst_title})

@app.route('/add-content', methods=['POST'])
def add_content():
    data = request.json
    content = data['content']
    rst_content = f"{content}\n"
    return jsonify({'rst': rst_content})

@app.route('/add-reference', methods=['POST'])
def add_reference():
    data = request.json
    ref_name = data['ref_name']
    ref_link = data['ref_link']
    rst_ref = f".. _{ref_name}: {ref_link}\n"
    return jsonify({'rst': rst_ref})

@app.route('/generate-rst', methods=['POST'])
def generate_rst():
    data = request.json
    content_list = data['content_list']
    full_rst = '\n'.join(content_list)
    return jsonify({'rst': full_rst})

@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    app.run(debug=True)

