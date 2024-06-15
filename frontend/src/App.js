import React, { useState } from 'react';
import axiosInstance from './axiosInstance';

function App() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [reference, setReference] = useState({ name: '', link: '' });
  const [rstDocument, setRstDocument] = useState([]);
  
  const addTitle = async () => {
    const response = await axiosInstance.post('/add-title', { title });
    setRstDocument([...rstDocument, response.data.rst]);
  };
  
  const addContent = async () => {
    const response = await axiosInstance.post('/add-content', { content });
    setRstDocument([...rstDocument, response.data.rst]);
  };
  
  const addReference = async () => {
    const response = await axiosInstance.post('/add-reference', reference);
    setRstDocument([...rstDocument, response.data.rst]);
  };
  
  const generateRst = async () => {
    const response = await axiosInstance.post('/generate-rst', { content_list: rstDocument });
    console.log(response.data.rst);
  };
  
  return (
    <div>
      <h1>Sphinx RST Generator</h1>
      <div>
        <h2>Add Title</h2>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button onClick={addTitle}>Add Title</button>
      </div>
      <div>
        <h2>Add Content</h2>
        <textarea value={content} onChange={(e) => setContent(e.target.value)}></textarea>
        <button onClick={addContent}>Add Content</button>
      </div>
      <div>
        <h2>Add Reference</h2>
        <input type="text" placeholder="Reference Name" value={reference.name} onChange={(e) => setReference({ ...reference, name: e.target.value })} />
        <input type="text" placeholder="Reference Link" value={reference.link} onChange={(e) => setReference({ ...reference, link: e.target.value })} />
        <button onClick={addReference}>Add Reference</button>
      </div>
      <div>
        <h2>Generated RST</h2>
        <pre>{rstDocument.join('\n')}</pre>
      </div>
      <button onClick={generateRst}>Generate RST</button>
    </div>
  );
}

export default App;

