import React, { useState, useEffect } from "react";
import axiosInstance from "./axiosInstance";
import { Button, Divider, Input, Space, Typography } from "antd";
import { DownloadOutlined } from "@ant-design/icons";

function App() {
  const { TextArea } = Input;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [reference, setReference] = useState({ name: "", link: "" });
  const [rstDocument, setRstDocument] = useState("");

  const handleEditableRstChange = (e) => {
    setRstDocument(e.target.value);
  };

  const addTitle = () => {
    const rstTitle = `${title}\n${"=".repeat(title.length)}\n`;
    setRstDocument(prev => prev + rstTitle);
    setTitle("");
  };

  const addContent = () => {
    const rstContent = `${content}\n`;
    setRstDocument(prev => prev + rstContent);
    setContent("");
  };

  const addReference = () => {
    const rstReference = `.. _${reference.name}: ${reference.link}\n`;
    setRstDocument(prev => prev + rstReference);
    setReference({ name: "", link: "" });
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
    <div className="flex h-screen bg-gray-200">
      <div className="w-1/4 p-4 border-r border-gray-300 bg-gray-100">
        <Typography.Title level={1}>Sphinx RST Generator</Typography.Title>
        <Typography.Title level={5}>Add Title</Typography.Title>
        <Space>
          <Input
            placeholder="please enter the title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Button type="primary" onClick={addTitle}>
            Submit
          </Button>
        </Space>
        <Divider />

        <Typography.Title level={5}>Add Content</Typography.Title>
        <Space>
          <TextArea
            rows={5}
            placeholder="please enter the content, max length 400"
            maxLength={400}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <Button type="primary" onClick={addContent}>
            Submit
          </Button>
        </Space>
        <Divider />

        <Typography.Title level={5}>Add Reference</Typography.Title>
        <Space>
          <Input
            placeholder="reference name"
            value={reference.name}
            onChange={(e) =>
              setReference({ ...reference, name: e.target.value })
            }
          />
          <Input
            placeholder="reference link"
            value={reference.link}
            onChange={(e) =>
              setReference({ ...reference, link: e.target.value })
            }
          />
          <Button type="primary" onClick={addReference}>
            Submit
          </Button>
        </Space>
        <Divider />
      </div>

      <div className="flex flex-col w-3/4 p-4 bg-gray-50">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <Typography.Title level={5}>Generated RST</Typography.Title>
            <TextArea
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
