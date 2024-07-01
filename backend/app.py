import io
import os
from flask import Flask, request, jsonify, send_from_directory, send_file, make_response
from flask_cors import CORS
from docutils.core import publish_string

app = Flask(__name__, static_folder='static', static_url_path='/')
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

GENERATED_FILES_DIR = "../generated_files"
if not os.path.exists(GENERATED_FILES_DIR):
    os.makedirs(GENERATED_FILES_DIR)

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/format', methods=['POST'])
def format_text():
    data = request.json
    text = data['text']
    format_type = data['format_type']

    if format_type == 'title':
        formatted_text = f"{text}\n{'=' * len(text)}\n"
    elif format_type == 'bold':
        formatted_text = f"**{text}**"
    elif format_type == 'italic':
        formatted_text = f"*{text}*"
    else:
        formatted_text = text

    return jsonify({'formatted_text': formatted_text})

# @app.route('/add-title', methods=['POST'])
# def add_title():
#     data = request.json
#     title = data['title']
#     rst_title = f"{title}\n{'=' * len(title)}\n"
#     return jsonify({'rst': rst_title})

# @app.route('/add-content', methods=['POST'])
# def add_content():
#     data = request.json
#     content = data['content']
#     rst_content = f"{content}\n"
#     return jsonify({'rst': rst_content})

# @app.route('/add-reference', methods=['POST'])
# def add_reference():
#     data = request.json
#     ref_name = data['ref_name']
#     ref_link = data['ref_link']
#     rst_ref = f".. _{ref_name}: {ref_link}\n"
#     return jsonify({'rst': rst_ref})

@app.route('/generate-rst', methods=['POST'])
def generate_rst():
    data = request.json
    content_list = data['content_list']
    if content_list:
        full_rst = '\n'.join(content_list)
        # file_path = os.path.join(GENERATED_FILES_DIR, 'generated_document.rst')
        # with open(file_path, 'w') as file:
        #     file.write(full_rst)
        # return send_file(file_path, as_attachment=True)
        rst_file = io.BytesIO()
        rst_file.write(full_rst.encode('utf-8'))
        rst_file.seek(0)
        response = make_response(send_file(rst_file, as_attachment=True, download_name='generated_document.rst', mimetype='text/x-rst'))
        return response
    else:
        return jsonify({'error': 'Missing content_list'}), 400

@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    app.run(debug=True)

