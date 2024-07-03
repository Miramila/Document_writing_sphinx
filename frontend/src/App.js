import React, { useState, useRef } from "react";
import axiosInstance from "./axiosInstance";
import { Button, Input, Typography, Modal, Form } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import Sidebar from "./components/Sidebar";
import "./App.css";

function App() {
  const { TextArea } = Input;
  const [rstDocument, setRstDocument] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState("");
  const [form] = Form.useForm();
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

  const showModal = (type) => {
    setModalType(type);
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields()
      .then(values => {
        form.resetFields();
        let formattedText = "";
        switch (modalType) {
          case "reference":
            const { ref_name, ref_link } = values;
            formattedText = `.. _${ref_name}: ${ref_link}\n`;
            break;
          case "version":
            const { version, description } = values;
            formattedText = `.. versionadded:: ${version}\n    ${description}\n`;
            break;
          default:
            const { directive_text } = values;
            formattedText = `.. ${modalType}::\n    ${directive_text}\n`;
            break;
        }
        insertAtCursor(formattedText);
        setIsModalVisible(false);
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const getModalContent = () => {
    switch (modalType) {
      case "reference":
        return (
          <>
            <Form.Item
              name="ref_name"
              label="Reference Name"
              rules={[{ required: true, message: 'Please input the reference name!' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="ref_link"
              label="Reference Link"
              rules={[{ required: true, message: 'Please input the reference link!' }]}
            >
              <Input />
            </Form.Item>
          </>
        );
      case "version":
        return (
          <>
            <Form.Item
              name="version"
              label="Version"
              rules={[{ required: true, message: 'Please input the version!' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Please input the description!' }]}
            >
              <Input.TextArea />
            </Form.Item>
          </>
        );
      default:
        return (
          <Form.Item
            name="directive_text"
            label="Directive Text"
            rules={[{ required: true, message: 'Please input the directive text!' }]}
          >
            <Input.TextArea />
          </Form.Item>
        );
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar formatSelectedText={formatSelectedText} showModal={showModal} />
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

      <Modal title="Insert Content" visible={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
        <Form form={form} layout="vertical" name="form_in_modal">
          {getModalContent()}
        </Form>
      </Modal>
    </div>
  );
}

export default App;


