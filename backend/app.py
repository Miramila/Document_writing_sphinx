import io
import os
from flask import Flask, request, jsonify, send_from_directory, send_file, make_response
from flask_cors import CORS
import shutil
from docutils.core import publish_string
import subprocess
import tempfile
import oss2
from oss2.credentials import EnvironmentVariableCredentialsProvider
import webbrowser
import pathlib
import time
import http.server
import socketserver
import uuid
from config import access_key_id, access_key_secret

app = Flask(__name__, static_folder='static', static_url_path='/')
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

GENERATED_FILES_DIR = "../generated_files"
if not os.path.exists(GENERATED_FILES_DIR):
    os.makedirs(GENERATED_FILES_DIR)


bucket_name = 'sphinx-test'
endpoint = 'https://oss-cn-shanghai.aliyuncs.com'

auth = oss2.Auth(access_key_id, access_key_secret)
bucket = oss2.Bucket(auth, endpoint, bucket_name)

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

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


@app.route('/build-sphinx', methods=['POST'])
def build_sphinx():
    data = request.json
    content_list = data.get('content_list')
    
    if not content_list:
        return jsonify({'error': 'Missing content_list'}), 400

    full_rst = '\n'.join(content_list)
    
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            parent_dir = pathlib.Path(temp_dir).parent
            save_html_path = parent_dir / 'save_html'
            if not save_html_path.exists():
                save_html_path.mkdir(parents=True, exist_ok=True)
                print(f"Directory 'save_html' created at: {save_html_path}")

            build_file_path = save_html_path / 'build'
            if build_file_path.exists():
                shutil.rmtree(build_file_path)
                print(f"Deleted file: {build_file_path}")

            docs_dir = os.path.join(temp_dir, 'docs')
            build_dir = os.path.join(temp_dir, 'build')
            
            os.makedirs(docs_dir)
            
            with open(os.path.join(docs_dir, 'index.rst'), 'w', encoding='utf-8') as f:
                f.write(full_rst)
            

            with open('backend/sphinx_config_files/conf.py', 'r', encoding='utf-8') as f:
                conf_py_content = f.read()
            with open(os.path.join(docs_dir, 'conf.py'), 'w', encoding='utf-8') as f:
                f.write(conf_py_content)
            
            with open('backend/sphinx_config_files/Makefile', 'r', encoding='utf-8') as f:
                makefile_content = f.read()
            with open(os.path.join(docs_dir, 'Makefile'), 'w', encoding='utf-8') as f:
                f.write(makefile_content)

            with open('backend/sphinx_config_files/make.bat', 'r', encoding='utf-8') as f:
                make_bat_content = f.read()
            with open(os.path.join(docs_dir, 'make.bat'), 'w', encoding='utf-8') as f:
                f.write(make_bat_content)

            
            subprocess.run(['sphinx-build', '-b', 'html', docs_dir, build_dir], check=True)
            zip_path = os.path.join(temp_dir, 'sphinx_build.zip')
            shutil.make_archive(os.path.splitext(zip_path)[0], 'zip', build_dir)

            shutil.move(build_dir, save_html_path)
            index_file_path = build_file_path / "index.html"

            # print(str(index_file_path))
            webbrowser.open("file://" + str(index_file_path))
        
            return send_file(zip_path, as_attachment=True, download_name='sphinx_build.zip')
        
    except subprocess.CalledProcessError as e:
        return jsonify({"message": "An error occurred while building Sphinx documentation.", "error": str(e)}), 500

@app.route('/upload', methods=['POST'])
def upload():
    try:
        file = request.files['file']
        filename = file.filename

        if bucket.object_exists(filename):
            filename, extension = os.path.splitext(filename)
            filename = f"{filename}_{uuid.uuid4().hex}{extension}"


        local_path = f"/tmp/{filename}"
        file.save(local_path)

        with open(local_path, 'rb') as fileobj:
            bucket.put_object(filename, fileobj, headers={'x-oss-forbid-overwrite': 'true'}, progress_callback=None)

        os.remove(local_path)

        return jsonify({"message": "File uploaded successfully!"}), 200

    except Exception as e:
        print(f"Error uploading file: {e}")
        return jsonify({"message": f"An error occurred while uploading the file."}), 500

@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)