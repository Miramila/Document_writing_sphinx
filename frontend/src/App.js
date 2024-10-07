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
  message
} from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import Sidebar from "./components/Sidebar";
import "./App.css";
import ModalForm from './components/ModalForm';

function App() {
  const { TextArea } = Input;
  const [rstDocument, setRstDocument] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState("");
  const [form] = Form.useForm();
  const textAreaRef = useRef(null);
  const [gridTable, setGridTable] = useState([]);
  const [gridRows, setGridRows] = useState(0);
  const [gridColumns, setGridColumns] = useState(0);
  // const [simpleTable, setSimpleTable] = useState([]);
  // const [simpleRows, setSimpleRows] = useState(0);
  // const [simpleColumns, setSimpleColumns] = useState(0);
  const [csvRows, setCsvRows] = useState(0);
  const [csvColumns, setCsvColumns] = useState(0);
  const [csvTable, setCsvTable] = useState([]);
  const [csvHeader, setCsvHeader] = useState([]);
  const [csvWidths, setCsvWidths] = useState([]);

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

  const buildSphinxDocs = async () => {
    try{
      const response = await axiosInstance.post("/build-sphinx", 
      { content_list: rstDocument.split("\n") },
      { responseType: "blob" });
      const blob = new Blob([response.data], { type: 'application/zip' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'sphinx_build.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);

      Modal.confirm({
        title: "Upload to Cloud",
        content: "Do you want to upload the file to the cloud?",
        onOk: () => uploadToCloud(blob),
      });
    } catch (error) {
      console.error("Error building Sphinx documentation:", error);
      alert("An error occurred while building Sphinx documentation.");
    }
  };

  const formatText = (selectedText, formatType, extraData = {}) => {
    let formattedText;
    switch (formatType) {
      case "bold":
        formattedText = `**${selectedText}**`;
        break;
      case "italic":
        formattedText = `*${selectedText}*`;
        break;
      case "code":
        formattedText = `\`\`\`\n${selectedText}\n\`\`\``;
        break;
      case "title":
        formattedText = `${selectedText}\n${"=".repeat(selectedText.length)}\n`;
        break;
      case "external_links":
        formattedText = `.. _${extraData.ref_name}: ${extraData.ref_link}\n`;
        break;
      case "internal_links":
        formattedText = `:ref:\`${selectedText}\``;
        break;
      case "paragraphs":
        formattedText = `${selectedText}\n\n`;
        break;
      case "subscript":
        formattedText = `\\ :sub:\`${selectedText}\`\\ `;
        break;
      case "superscript":
        formattedText = `\\ :sup:\`${selectedText}\`\\ `;
        break;
      case "reference":
        formattedText = `:literal:\`${selectedText}\``;
        break;
      case "title-reference":
        formattedText = `*《${selectedText}》*`;
        break;
      case "version":
        formattedText = `.. versionadded:: ${extraData.version}\n    ${extraData.description}\n`;
        break;
      case "csv-table":
        formattedText = `.. csv-table:: ${extraData.table_title}\n:header: ${extraData.table_header}\n\n${extraData.table_content}\n`;
        break;
      case "toctree":
        formattedText = `.. toctree::\n`;
        if (extraData.maxdepth) {
          formattedText += `   :maxdepth: ${extraData.maxdepth}\n`;
        }
        if (extraData.caption) {
          formattedText += `   :caption: ${extraData.caption}\n`;
        }
        if (extraData.numbered) {
          formattedText += `   :numbered:\n`;
        }
        formattedText += "\n" + extraData.documents.map((doc) => `   ${doc}`).join("\n") + "\n";
        break;
      case "codeblock":
        formattedText = `.. code-block:: ${extraData.language}\n`;
        if (extraData.lineno_start) {
          formattedText += `   :lineno-start: ${extraData.lineno_start}\n`;
        }
        if (extraData.emphasize_lines) {
          formattedText += `   :emphasize-lines: ${extraData.emphasize_lines}\n`;
        }
        if (extraData.caption_code) {
          formattedText += `   :caption: ${extraData.caption_code}\n`;
        }
        if (extraData.name) {
          formattedText += `   :name: ${extraData.name}\n`;
        }
        if (extraData.linenos) {
          formattedText += `   :linenos:\n`;
        }
        formattedText += `\n${extraData.code.split('\n').map((line) => `   ${line}`).join('\n')}\n`;
        break;
      case "image":
        formattedText = `.. image:: ${extraData.image_path}\n`;
        if (extraData.align) {
          formattedText += `   :align: ${extraData.align}\n`;
        }
        if (extraData.alt) {
          formattedText += `   :alt: ${extraData.alt}\n`;
        }
        if (extraData.height) {
          formattedText += `   :height: ${extraData.height}\n`;
        }
        if (extraData.width) {
          formattedText += `   :width: ${extraData.width}\n`;
        }
        if (extraData.loading) {
          formattedText += `   :loading: ${extraData.loading}\n`;
        }
        if (extraData.scale) {
          formattedText += `   :scale: ${extraData.scale}\n`;
        }
        if (extraData.target) {
          formattedText += `   :target: ${extraData.target}\n`;
        }
        break;
      case "math":
        formattedText = `.. math::\n\n${extraData.equation}\n`;
        break;
      default:
        formattedText = selectedText;
    }
    return formattedText;
};

  const formatSelectedText = async (formatType) => {
    const textArea = textAreaRef.current.resizableTextArea.textArea;
    const startPos = textArea.selectionStart;
    const endPos = textArea.selectionEnd;
    const selectedText = textArea.value.substring(startPos, endPos);

    const formattedText = formatText(selectedText, formatType);
    insertAtCursor(formattedText);
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

  const uploadToCloud = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file, "sphinx_build.zip");
  
      // Call the new endpoint
      await axiosInstance.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
  
      message.success("File uploaded successfully!");
    } catch (error) {
      console.error("Error uploading file:", error);
      message.error("An error occurred while uploading the file.");
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
            const { maxdepth, numbered, documents } = values;
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
            const { equation } = values;
            formattedText = `.. math::\n`;
            formattedText +=
              "\n" +
              equation
                .split("\n")
                .map((doc) => `   ${doc.trim()}\n`)
                .join("\n") +
              "\n";
            break;

            case "csv-table":
            const { rows_csv, columns_csv } = values;
            setCsvRows(rows_csv);
            setCsvColumns(columns_csv);
            setCsvHeader(Array(columns_csv).fill(""));
            setCsvWidths(Array(columns_csv).fill(""));
            setCsvTable(Array.from({ length: rows_csv }, () => Array(columns_csv).fill("")));
            setIsModalVisible(false);
            setTimeout(() => {
              setIsModalVisible(true);
              setModalType("csv-table-edit");
            }, 0);
            return;

          case "csv-table-edit":
            const header = values.header.map(cell => cell || "");
          const widths = values.widths.map(width => width || "");
          const content = values.table_content.map(row => row.map(cell => cell ? `"${cell.trim()}"` : '""'));
          formattedText = `.. csv-table:: ${values.table_title}\n`;
          formattedText += `    :header: ${header.map(cell => `"${cell.trim()}"`).join(", ")}\n`;
          formattedText += `    :widths: ${widths.join(", ")}\n\n`;
          formattedText += content.map(row => `    ${row.join(", ")}`).join("\n") + "\n";
            break;

          case "needbar":
            const { bar_values, bar_title } = values;
            formattedText = `.. needbar::\n`;
            formattedText += `:title: ${bar_title}\n`;
            formattedText +=
              "\n" +
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
              formattedText += `    :tags: ${tags
                .split(",")
                .map((tag) => tag.trim())
                .join("; ")}\n`;
            }
            if (status) {
              formattedText += `    :status: ${status
                .split(",")
                .map((s) => s.trim())
                .join("; ")}\n`;
            }
            break;

          case "needtable":
            const {
              table_name,
              table_columns,
              table_tags,
              table_status,
            } = values;
            formattedText = `.. needtable:: ${table_name}\n`;
            if (table_columns) {
              formattedText += `    :columns: ${table_columns
                .split(",")
                .map((col) => col.trim())
                .join("; ")}\n`;
            }
            if (table_tags) {
              formattedText += `    :tags: ${table_tags
                .split(",")
                .map((tag) => tag.trim())
                .join("; ")}\n`;
            }
            if (table_status) {
              formattedText += `    :status: ${table_status
                .split(",")
                .map((s) => s.trim())
                .join("; ")}\n`;
            }
            break;

          case "needflow":
            const {
              flow_name,
              flow_filter,
              flow_tags,
              flow_linkTypes,
            } = values;
            formattedText = `.. needflow:: ${flow_name}\n`;
            if (flow_filter) {
              formattedText += `    :filter: ${flow_filter}\n`;
            }
            if (flow_tags) {
              formattedText += `    :tags: ${flow_tags
                .split(",")
                .map((tag) => tag.trim())
                .join("; ")}\n`;
            }
            if (flow_linkTypes) {
              formattedText += `    :link_types: ${flow_linkTypes
                .split(",")
                .map((lt) => lt.trim())
                .join("; ")}\n`;
            }
            formattedText += `    :show_link_names:\n`;
            break;

          case "needextract":
            const {
              extract_filter,
              extract_layout,
              extract_style,
            } = values;
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
            const {
              needextend_filterString,
              needextend_option,
              needextend_addOption,
              needextend_removeOption,
            } = values;
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

          case "grid_table":
            const { rows, columns } = values;
            let table = [];
            for (let i = 0; i < rows; i++) {
              let row = [];
              for (let j = 0; j < columns; j++) {
                row.push("");
              }
              table.push(row);
            }
            setGridTable(table);
            setGridRows(rows);
            setGridColumns(columns);
            setIsModalVisible(false);
            setTimeout(() => {
              setIsModalVisible(true);
              setModalType("grid_table_edit");
            }, 0);
            return;

          case "grid_table_edit":
            const updatedTable = values.table.map((row) =>
              row.map((cell) => cell || "")
            );
            formattedText = createGridTable(updatedTable);
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

  const createGridTable = (table) => {
    let columnWidths = table[0].map(
      (_, colIndex) => Math.max(...table.map((row) => row[colIndex].length)) + 2
    );

    const headerSeparator = columnWidths
      .map((width) => "=".repeat(width))
      .join("+");
    const rowSeparator = columnWidths
      .map((width) => "-".repeat(width))
      .join("+");

    let result = `+${rowSeparator}+\n`;
    result +=
      `|` +
      table[0]
        .map(
          (cell, index) =>
            ` ${cell}${" ".repeat(columnWidths[index] - cell.length - 2)} `
        )
        .join("|") +
      `|\n`;
    result += `+${headerSeparator}+\n`;

    for (let i = 1; i < table.length; i++) {
      result +=
        `|` +
        table[i]
          .map(
            (cell, index) =>
              ` ${cell}${" ".repeat(columnWidths[index] - cell.length - 2)} `
          )
          .join("|") +
        `|\n`;
      result += `+${rowSeparator}+\n`;
    }

    console.log("the original table is", result)

    return result;
  };

  const addColumn = () => {
    const newGridTable = gridTable.map((row) => [...row, ""]);
    setGridTable(newGridTable);
    setGridColumns(gridColumns + 1);
  };

  const addRow = () => {
    const newRow = Array(gridColumns).fill("");
    const newGridTable = [...gridTable, newRow];
    setGridTable(newGridTable);
    setGridRows(gridRows + 1);
  };

  const removeLastColumn = () => {
    if (gridColumns > 1) {
      setGridTable(prevTable => prevTable.map(row => row.slice(0, -1)));
      setGridColumns(prevColumns => prevColumns - 1);
    }
  };
  
  const removeLastRow = () => {
    if (gridRows > 1) {
      setGridTable(prevTable => prevTable.slice(0, -1));
      setGridRows(prevRows => prevRows - 1);
    }
  };

  const addCsvColumn = () => {
    setCsvHeader(prevHeader => [...prevHeader, '']);
    setCsvWidths(prevWidths => [...prevWidths, '']);
    setCsvTable(prevTable => prevTable.map(row => [...row, '']));
    setCsvColumns(prevColumns => prevColumns + 1);
  };
  
  const addCsvRow = () => {
    setCsvTable(prevTable => [...prevTable, Array(csvColumns).fill('')]);
    setCsvRows(prevRows => prevRows + 1);
  };
  
  const removeLastCsvColumn = () => {
    if (csvColumns > 1) {
      setCsvHeader(prevHeader => prevHeader.slice(0, -1));
      setCsvWidths(prevWidths => prevWidths.slice(0, -1));
      setCsvTable(prevTable => prevTable.map(row => row.slice(0, -1)));
      setCsvColumns(prevColumns => prevColumns - 1);
    }
  };
  
  const removeLastCsvRow = () => {
    if (csvRows > 1) {
      setCsvTable(prevTable => prevTable.slice(0, -1));
      setCsvRows(prevRows => prevRows - 1);
    }
  };

  return (
    <div className="flex h-screen relative">
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
          <div className="flex flex-col ml-4">
            <Button
              type="primary"
              shape="round"
              icon={<DownloadOutlined />}
              size={"large"}
              onClick={generateRst}
              className="mb-4"
            >
              Download
            </Button>
            <Button
              type="primary"
              shape="round"
              icon={<DownloadOutlined />}
              size={"large"}
              onClick={buildSphinxDocs}
            >
              Build Sphinx Docs
            </Button>
          </div>
          <div className="fixed bottom-0 left-0 m-4">
            <Button
              type="primary"
              size={"medium"}
              style={{ 
                backgroundColor: '#1890ff', 
                border: '1px solid #1890ff'
              }}
              onClick={() => window.location.href = 'http://23.95.227.124:8080/'}
            >
              UPP AI Bot
            </Button>
          </div>
        </div>
      </div>
  
      <Modal
        title="Insert Content"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical" name="form_in_modal">
        <ModalForm
            form={form}
            modalType={modalType}
            addCsvRow={addCsvRow}
            addCsvColumn={addCsvColumn}
            removeLastCsvRow={removeLastCsvRow}
            removeLastCsvColumn={removeLastCsvColumn}
            csvColumns={csvColumns}
            csvRows={csvRows}
            addRow={addRow}
            addColumn={addColumn}
            removeLastRow={removeLastRow}
            removeLastColumn={removeLastColumn}
            gridTable={gridTable}
            gridColumns={gridColumns}
            gridRows={gridRows}
          />
        </Form>
      </Modal>
    </div>
  );
}  

export default App;
