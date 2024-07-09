import React, { useState, useRef } from "react";
import axiosInstance from "./axiosInstance";
import {
  Button,
  Input,
  InputNumber,
  Typography,
  Modal,
  Form,
  Checkbox,
  Select,
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
            formattedText = `.. note::\n    ${note_text}\n`;
            break;

          case "warning":
            const { warning_text } = values;
            formattedText = `.. warning::\n    ${warning_text}\n`;
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

          case "needbar":
            const { bar_values, bar_title} = values;
            formattedText = `.. needbar::\n`;
            formattedText += `:title: ${bar_title}\n`
            formattedText += "\n" +
            bar_values
              .split("\n")
              .map((val) => `   ${val.trim()}`)
              .join("\n") +
            "\n";
            break;
          case "needlist":
          const { tags, status } = values;
          formattedText = `.. needlist::\n`;
          if (tags) {
            formattedText += `    :tags: ${tags.split(",").map(tag => tag.trim()).join("; ")}\n`;
          }
          if (status) {
            formattedText += `    :status: ${status.split(",").map(s => s.trim()).join("; ")}\n`;
          }
            break;

          case "needtable":
            const { table_name, table_columns, table_tags, table_status} = values;
            formattedText = `.. needtable:: ${table_name}\n`;
            if (table_columns) {
              formattedText += `    :columns: ${table_columns.split(",").map(col => col.trim()).join("; ")}\n`;
            }
            if (table_tags) {
              formattedText += `    :tags: ${table_tags.split(",").map(tag => tag.trim()).join("; ")}\n`;
            }
            if (table_status) {
              formattedText += `    :status: ${table_status.split(",").map(s => s.trim()).join("; ")}\n`;
            }
            break;

          case "needflow":
            const { flow_name, flow_filter, flow_tags, flow_linkTypes } = values;
            formattedText = `.. needflow:: ${flow_name}\n`;
            if (flow_filter) {
              formattedText += `    :filter: ${flow_filter}\n`;
            }
            if (flow_tags) {
              formattedText += `    :tags: ${flow_tags.split(",").map(tag => tag.trim()).join("; ")}\n`;
            }
            if (flow_linkTypes) {
              formattedText += `    :link_types: ${flow_linkTypes.split(",").map(lt => lt.trim()).join("; ")}\n`;
            }
            formattedText += `    :show_link_names:\n`;
            break;

          case "needextract":
            const { filter: extract_filter, extract_layout, extract_style } = values;
            formattedText = `.. needextract::\n`;
            if (extract_filter) {
              formattedText += `    :filter: ${extract_filter}\n`;
            }
            if (extract_layout) {
              formattedText += `    :layout: ${extract_layout}\n`;
            }
            if (extract_style) {
              formattedText += `    :style: ${extract_style}\n`;
            }
            break;

          case "needextend":
            const { needextend_filterString, needextend_option, needextend_addOption, needextend_removeOption } = values;
            formattedText = `.. needextend:: ${needextend_filterString}\n`;
            if (needextend_option) {
              formattedText += `    :option: ${needextend_option}\n`;
            }
            if (needextend_addOption) {
              formattedText += `    :+option: ${needextend_addOption}\n`;
            }
            if (needextend_removeOption) {
              formattedText += `    :-option: ${needextend_removeOption}\n`;
            }
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
              name="note_text"
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
              name="warning_text"
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
              name="image_url"
              label="Image URL"
              rules={[
                { required: true, message: "Please input the image URL!" },
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
              name="figure_url"
              label="Figure URL"
              rules={[
                { required: true, message: "Please input the figure URL!" },
              ]}
            >
              <Input />
            </Form.Item>
          </>
        );

      case "math":
        return (
          <Form.Item
            name="equation"
            label="Math Equation (one per line)"
            rules={[
              { required: true, message: "Please input the math equation!" },
            ]}
          >
            <Input.TextArea />
          </Form.Item>
        );

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

      case "needbar":
        return (
          <>
          <Form.Item
            name="bar_title"
            label="Bar title"
            rules={[
              { required: false, message: "Please input the bar header!" },
            ]}
          >
            <Input.TextArea />
            </Form.Item>

          <Form.Item
            name="bar_values"
            label="Bar Values (one per line)"
            rules={[
              { required: true, message: "Please input the bar values!" },
            ]}
          >
            <Input.TextArea />
            </Form.Item>
          </>
        );
      case "needlist":
      return (
        <>
          <Form.Item
            name="tags"
            label="Tags (comma-separated)"
            rules={[
              { required: false, message: "Please input the tags!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="status"
            label="Status (comma-separated)"
            rules={[
              { required: false, message: "Please input the status!" },
            ]}
          >
            <Input />
          </Form.Item>
          {/* Add more form items here for other need options as needed */}
        </>
      );
      
      case "needtable":
        return (
          <>
            <Form.Item
              name="table_name"
              label="Table Name"
              rules={[{ required: false, message: "Please input the table name!" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="table_columns"
              label="Columns (comma-separated)"
              rules={[{ required: false, message: "Please input the columns!" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="table_tags"
              label="Tags (comma-separated)"
              rules={[{ required: false, message: "Please input the tags!" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="table_status"
              label="Status (comma-separated)"
              rules={[{ required: false, message: "Please input the status!" }]}
            >
              <Input />
            </Form.Item>
            {/* Add more form items here for other need options as needed */}
          </>
        );

      
      case "needflow":
        return (
          <>
            <Form.Item
              name="flow_name"
              label="Flowchart Name"
              rules={[{ required: false, message: "Please input the flowchart name!" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="flow_filter"
              label="Filter"
              rules={[{ required: false, message: "Please input the filter!" }]}
            >
              <TextArea rows={3} />
            </Form.Item>
            <Form.Item
              name="flow_tags"
              label="Tags (comma-separated)"
              rules={[{ required: false, message: "Please input the tags!" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="flow_linkTypes"
              label="Link Types (comma-separated)"
              rules={[{ required: false, message: "Please input the link types!" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="show_link_names"
              label="Show Link Names"
              rules={[{ required: false, message: "Please input the link names!" }]}
            >
              <Checkbox defaultChecked />
            </Form.Item>
          </>
        );

      
      case "needextract":
        return (
          <>
            <Form.Item
              name="extract_filter"
              label="Filter"
              rules={[{ required: true, message: "Please input the filter!" }]}
            >
              <TextArea rows={3} />
            </Form.Item>
            <Form.Item
              name="extract_layout"
              label="Layout"
              rules={[{ required: false, message: "Please input the layout!" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="extract_style"
              label="Style"
              rules={[{ required: false, message: "Please input the style!" }]}
            >
              <Input />
            </Form.Item>
          </>
        );

      
      case "needextend":
        return (
          <>
            <Form.Item
              name="needextend_filterString"
              label="Filter String"
              rules={[{ required: true, message: "Please input the filter string!" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="needextend_option"
              label="Option"
              rules={[{ required: false, message: "Please input the option!" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="needextend_addOption"
              label="Add Option"
              rules={[{ required: false, message: "Please input the add option!" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="needextend_removeOption"
              label="Remove Option"
              rules={[{ required: false, message: "Please input the remove option!" }]}
            >
              <Input />
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
