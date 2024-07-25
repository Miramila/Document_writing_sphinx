import io
import os
from flask import Flask, request, jsonify, send_from_directory, send_file, make_response
from flask_cors import CORS
import shutil
from docutils.core import publish_string
import subprocess
import tempfile

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
#TODO: table/标题分级/菜单栏/内部标签改modal
    if format_type == 'title':
        formatted_text = f"{text}\n{'=' * len(text)}\n"
    elif format_type == 'bold':
        formatted_text = f"**{text}**"
    elif format_type == 'italic':
        formatted_text = f"*{text}*"
    elif format_type == 'external_links':
        ref_name = data.get('ref_name', '')
        ref_link = data.get('ref_link', '')
        formatted_text = f".. _{ref_name}: {ref_link}\n"
    elif format_type == 'internal_links':
        formatted_text = f":ref:`{text}`" # 内部标签需要限制唯一
    elif format_type == 'paragraphs':
        formatted_text = f"{text}\n\n" # add a new line after each paragraph
    elif format_type == 'subscript':
        formatted_text = f"\ :sub:` {text}`\ "
    elif format_type == 'superscript':
        formatted_text = f"\ :sup:` {text}`\ "
    elif format_type == 'reference':
        formatted_text = f":literal:`{text}`"
    elif format_type == 'title-reference':
        formatted_text = f"*《{text}》*"   
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

#TODO: figure out how to put find the sphinx source
@app.route('/build-sphinx', methods=['POST'])
def build_sphinx():
    data = request.json
    content_list = data.get('content_list')
    
    if not content_list:
        return jsonify({'error': 'Missing content_list'}), 400

    full_rst = '\n'.join(content_list)
    
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            docs_dir = os.path.join(temp_dir, 'docs')
            build_dir = os.path.join(temp_dir, 'build')
            
            # Create necessary directories
            os.makedirs(docs_dir)
            
            # Write the rst content to the temporary index.rst file
            with open(os.path.join(docs_dir, 'index.rst'), 'w', encoding='utf-8') as f:
                f.write(full_rst)
            
            # Write a basic conf.py if not provided
            conf_py_content = """
# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = 'test'
copyright = '2024, Bonnie'
author = 'Bonnie'

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

extensions = []

templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']



# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = 'alabaster'
html_static_path = ['_static']
"""
            with open(os.path.join(docs_dir, 'conf.py'), 'w', encoding='utf-8') as f:
                f.write(conf_py_content)
            
#             # Write a basic Makefile for Unix-like systems
#             makefile_content = """
# # Minimal makefile for Sphinx documentation
# #

# # You can set these variables from the command line, and also
# # from the environment for the first two.
# SPHINXOPTS    ?=
# SPHINXBUILD   ?= sphinx-build
# SOURCEDIR     = .
# BUILDDIR      = _build

# # Put it first so that "make" without argument is like "make help".
# help:
# 	@$(SPHINXBUILD) -M help "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)

# .PHONY: help Makefile

# # Catch-all target: route all unknown targets to Sphinx using the new
# # "make mode" option.  $(O) is meant as a shortcut for $(SPHINXOPTS).
# %: Makefile
# 	@$(SPHINXBUILD) -M $@ "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)
# """
#             with open(os.path.join(docs_dir, 'Makefile'), 'w', encoding='utf-8') as f:
#                 f.write(makefile_content)
            
#             # Write a basic make.bat for Windows systems
#             make_bat_content = """
# @ECHO OFF

# pushd %~dp0

# REM Command file for Sphinx documentation

# if "%SPHINXBUILD%" == "" (
# 	set SPHINXBUILD=sphinx-build
# )
# set SOURCEDIR=.
# set BUILDDIR=_build

# %SPHINXBUILD% >NUL 2>NUL
# if errorlevel 9009 (
# 	echo.
# 	echo.The 'sphinx-build' command was not found. Make sure you have Sphinx
# 	echo.installed, then set the SPHINXBUILD environment variable to point
# 	echo.to the full path of the 'sphinx-build' executable. Alternatively you
# 	echo.may add the Sphinx directory to PATH.
# 	echo.
# 	echo.If you don't have Sphinx installed, grab it from
# 	echo.https://www.sphinx-doc.org/
# 	exit /b 1
# )

# if "%1" == "" goto help

# %SPHINXBUILD% -M %1 %SOURCEDIR% %BUILDDIR% %SPHINXOPTS% %O%
# goto end

# :help
# %SPHINXBUILD% -M help %SOURCEDIR% %BUILDDIR% %SPHINXOPTS% %O%

# :end
# popd
# """
#             with open(os.path.join(docs_dir, 'make.bat'), 'w', encoding='utf-8') as f:
#                 f.write(make_bat_content)
            
            # Run the Sphinx build process
            subprocess.run(['sphinx-build', '-b', 'html', docs_dir, build_dir], check=True)
            zip_path = os.path.join(temp_dir, 'sphinx_build.zip')
            shutil.make_archive(os.path.splitext(zip_path)[0], 'zip', build_dir)
        
            # Send the zip file back to the client
            return send_file(zip_path, as_attachment=True, download_name='sphinx_build.zip')

    except subprocess.CalledProcessError as e:
        return jsonify({"message": "An error occurred while building Sphinx documentation.", "error": str(e)}), 500

@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)