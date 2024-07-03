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
    text = data.get('text', '')
    format_type = data.get('format_type', '')

    if format_type == 'title':
        formatted_text = f"{text}\n{'=' * len(text)}\n"
    elif format_type == 'bold':
        formatted_text = f"**{text}**"
    elif format_type == 'italic':
        formatted_text = f"*{text}*"
    elif format_type == 'reference':
        ref_name = data.get('ref_name', '')
        ref_link = data.get('ref_link', '')
        formatted_text = f".. _{ref_name}: {ref_link}\n"
    elif format_type == 'version':
        version = data.get('version', '')
        description = data.get('description', '')
        formatted_text = f".. versionadded:: {version}\n    {description}\n"
    elif format_type == 'csv-table':
        table_title = data.get('table_title', '')
        table_header = data.get('table_header', '')
        table_content = data.get('table_content', '')
        formatted_text = f".. csv-table:: {table_title}\n:header: {table_header}\n\n{table_content}\n"
    elif format_type == 'toctree':
        maxdepth = data.get('maxdepth', '')
        caption = data.get('caption', '')
        numbered = data.get('numbered', False)
        documents = data.get('documents', [])
        formatted_text = ".. toctree::\n"
        if maxdepth:
            formatted_text += f"   :maxdepth: {maxdepth}\n"
        if caption:
            formatted_text += f"   :caption: {caption}\n"
        if numbered:
            formatted_text += "   :numbered:\n"
        formatted_text += "\n" + "\n".join([f"   {doc}" for doc in documents]) + "\n"
    elif format_type == 'codeblock':
        language = data.get('language', '')
        lineno_start = data.get('lineno_start', '')
        emphasize_lines = data.get('emphasize_lines', '')
        caption_code = data.get('caption_code', '')
        name = data.get('name', '')
        linenos = data.get('linenos', False)
        code = data.get('code', '')
        formatted_text = f".. code-block:: {language}\n"
        if lineno_start:
            formatted_text += f"   :lineno-start: {lineno_start}\n"
        if emphasize_lines:
            formatted_text += f"   :emphasize-lines: {emphasize_lines}\n"
        if caption_code:
            formatted_text += f"   :caption: {caption_code}\n"
        if name:
            formatted_text += f"   :name: {name}\n"
        if linenos:
            formatted_text += "   :linenos:\n"
        formatted_text += "\n" + "\n".join([f"   {line}" for line in code.split('\n')]) + "\n"
    elif format_type == 'image':
        image_path = data.get('image_path', '')
        align = data.get('align', '')
        alt = data.get('alt', '')
        height = data.get('height', '')
        width = data.get('width', '')
        loading = data.get('loading', '')
        scale = data.get('scale', '')
        target = data.get('target', '')
        formatted_text = f".. image:: {image_path}\n"
        if align:
            formatted_text += f"   :align: {align}\n"
        if alt:
            formatted_text += f"   :alt: {alt}\n"
        if height:
            formatted_text += f"   :height: {height}\n"
        if width:
            formatted_text += f"   :width: {width}\n"
        if loading:
            formatted_text += f"   :loading: {loading}\n"
        if scale:
            formatted_text += f"   :scale: {scale}\n"
        if target:
            formatted_text += f"   :target: {target}\n"
    elif format_type == 'math':
        equation = data.get('equation', '')
        formatted_text = f".. math::\n\n{equation}\n"
    else:
        formatted_text = text

    return jsonify({'formatted_text': formatted_text})

@app.route('/generate-rst', methods=['POST'])
def generate_rst():
    data = request.json
    content_list = data['content_list']
    if content_list:
        full_rst = '\n'.join(content_list)
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