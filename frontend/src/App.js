import React, { useState, useRef } from "react";
import axiosInstance from "./axiosInstance";
import { Button, Input, Typography } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import Sidebar from "./components/Sidebar";
import "./App.css";

function App() {
  const { TextArea } = Input;
  const [rstDocument, setRstDocument] = useState("");
  const textAreaRef = useRef(null);

  const handleEditableRstChange = (e) => {
    setRstDocument(e.target.value);
  };

  const insertAtCursor = (text) => {
    const textArea = textAreaRef.current.resizableTextArea.textArea;
    const startPos = textArea.selectionStart;
    const endPos = textArea.selectionEnd;
    const newValue = rstDocument.substring(0, startPos) + text + rstDocument.substring(endPos, rstDocument.length);
    setRstDocument(newValue);
    setTimeout(() => {
      textArea.selectionStart = textArea.selectionEnd = startPos + text.length;
      textArea.focus();
    }, 0);
  };

  const formatSelectedText = async (formatType) => {
    const textArea = textAreaRef.current.resizableTextArea.textArea;
    const startPos = textArea.selectionStart;
    const endPos = textArea.selectionEnd;
    const selectedText = textArea.value.substring(startPos, endPos);

    try {
      const response = await axiosInstance.post('/format', {
        text: selectedText,
        format_type: formatType
      });
      const formattedText = response.data.formatted_text;
      insertAtCursor(formattedText);
    } catch (error) {
      console.error('Error formatting text:', error);
    }
  };

  const generateRst = async () => {
    try {
      const response = await axiosInstance.post('/generate-rst', { content_list: rstDocument.split("\n") }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'generated_document.rst');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error generating RST:', error);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar formatSelectedText={formatSelectedText} />
      <div className="flex flex-col w-full p-4 bg-gray-50">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <Typography.Title level={5}>Generated RST</Typography.Title>
            <TextArea
              ref={textAreaRef}
              rows={20}
              className="p-2 bg-white border rounded"
              value={rstDocument}
              onChange={handleEditableRstChange}
            />
          </div>
          <Button
            type="primary"
            shape="round"
            icon={<DownloadOutlined />}
            size={"large"}
            onClick={generateRst}
            className="ml-4"
          >
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;


