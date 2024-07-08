import React, { useState, useRef } from "react";
import axiosInstance from "./axiosInstance";
import {
  Button,
  Input,
  Typography,
  Modal,
  Form,
  Checkbox,
  InputNumber,
} from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import Sidebar from "./components/Sidebar";
import "./App.css";

function App() {
  const { TextArea } = Input;
  const { Option } = Select;
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
    const newValue =
      rstDocument.substring(0, startPos) +
      text +
      rstDocument.substring(endPos, rstDocument.length);
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
      const response = await axiosInstance.post("/format", {
        text: selectedText,
        format_type: formatType,
      });
      const formattedText = response.data.formatted_text;
      insertAtCursor(formattedText);
    } catch (error) {
      console.error("Error formatting text:", error);
    }
  };

  const generateRst = async () => {
    try {
      const response = await axiosInstance.post(
        "/generate-rst",
        { content_list: rstDocument.split("\n") },
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "generated_document.rst");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error generating RST:", error);
    }
  };

  const showModal = (type) => {
    setModalType(type);
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        form.resetFields();
        let formattedText = "";
        switch (modalType) {
          case "reference":
            const { ref_name, ref_link } = values;
            formattedText = `.. _${ref_name}: ${ref_link}\n`;
            break;
          case "toctree":
            const { maxdepth, caption, numbered, documents } = values;
            formattedText = `.. toctree::\n   :maxdepth: ${maxdepth}\n`;
            if (numbered) {
              formattedText += "   :numbered:\n";
            }

            formattedText +=
              "\n" +
              documents
                .split("\n")
                .map((doc) => `   ${doc.trim()}`)
                .join("\n") +
              "\n";
            break;

          case "codeblock":
            const { language, code } = values;
            formattedText = `.. code-block:: ${language}\n`;
            formattedText +=
              "\n" +
              code
                .split("\n")
                .map((doc) => `   ${doc.trim()}`)
                .join("\n") +
              "\n";
            break;

          case "note":
            const { note_text } = values;
            formattedText = `.. note::\n    ${directive_text}\n`;
            break;

          case "warning":
            const { warning_text } = values;
            formattedText = `.. warning::\n    ${directive_text}\n`;
            break;

          case "image":
            const { image_url } = values;
            formattedText = `.. image:: ${image_url}\n`;
            break;

          case "figure":
            const { figure_url } = values;
            formattedText = `.. figure:: ${figure_url}\n`;
            break;

            case "math":
              const {equation} = values;
              formattedText = `.. math::\n`;
              formattedText += "\n" +
              equation
                .split("\n")
                .map((doc) => `   ${doc.trim()}\n`)
                .join("\n") +
              "\n";
              break;
            
              case "csv-table":
                const { table_title, table_header, table_content } = values;
                formattedText = `.. csv-table:: ${table_title}\n:header: ${table_header}\n\n${table_content.split('\n').map(row => row.trim()).join('\n')}\n`;
                break;

          default:
            const { directive_text } = values;
            formattedText = `.. ${modalType}::\n    ${directive_text}\n`;
            break;
        }
        insertAtCursor(formattedText);
        setIsModalVisible(false);
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
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
              rules={[
                { required: true, message: "Please input the reference name!" },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="ref_link"
              label="Reference Link"
              rules={[
                { required: true, message: "Please input the reference link!" },
              ]}
            >
              <Input />
            </Form.Item>
          </>
        );
      case "toctree":
        return (
          <>
            <Form.Item
              name="maxdepth"
              label="Max Depth"
              rules={[
                { required: true, message: "Please input the max depth!" },
              ]}
            >
              <InputNumber />
            </Form.Item>
            <Form.Item name="numbered" valuePropName="checked">
              <Checkbox>Numbered</Checkbox>
            </Form.Item>
            <Form.Item
              name="documents"
              label="Documents (one per line)"
              rules={[
                { required: true, message: "Please input the documents!" },
              ]}
            >
              <Input.TextArea rows={5} />
            </Form.Item>
          </>
        );

      case "codeblock":
        return (
          <>
            <Form.Item
              name="language"
              label="Language"
              rules={[
                { required: true, message: "Please input the language name!" },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="code"
              label="Code (one per line)"
              rules={[{ required: true, message: "Please input the code!" }]}
            >
              <Input.TextArea rows={5} />
            </Form.Item>
          </>
        );

      case "note":
        return (
          <>
            <Form.Item
              name="description"
              label="Description"
              rules={[
                { required: true, message: "Please input the description!" },
              ]}
            >
              <Input.TextArea />
            </Form.Item>
          </>
        );

      case "warning":
        return (
          <>
            <Form.Item
              name="description"
              label="Description"
              rules={[
                { required: true, message: "Please input the description!" },
              ]}
              
            >
              <Input.TextArea />
            </Form.Item>
          </>
        );

      case "image":
        return (
          <>
            <Form.Item
              name="image"
              label="image_url"
              rules={[
                { required: true, message: "Please input the description!" },
              ]}
            >
              <Input />
            </Form.Item>
          </>
        );

      case "figure":
        return (
          <>
            <Form.Item
              name="figure"
              label="figure_url"
              rules={[
                { required: true, message: "Please input the description!" },
              ]}
            >
              <Input />
            </Form.Item>
          </>
        );
      
        case "math":
          return(
            <Form.Item
              name="equation"
              label="Math Equation(one per line)"
              rules={[
                { required: true, message: "Please input the math equation!" },
              ]}
            >
              <Input.TextArea />
            </Form.Item>
          )
  
          case "csv-table":
            return (
              <>
                <Form.Item
                  name="table_title"
                  label="Table Title"
                  rules={[{ required: true, message: 'Please input the table title!' }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="table_header"
                  label="Table Header (comma-separated)"
                  rules={[{ required: true, message: 'Please input the table header!' }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="table_content"
                  label="Table Content (comma-separated, one row per line)"
                  rules={[{ required: true, message: 'Please input the table content!' }]}
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
            rules={[
              { required: true, message: "Please input the directive text!" },
            ]}
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

      <Modal
        title="Insert Content"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical" name="form_in_modal">
          {getModalContent()}
        </Form>
      </Modal>
    </div>
  );
}

export default App;
