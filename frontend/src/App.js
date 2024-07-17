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
    } catch (error) {
      console.error("Error building Sphinx documentation:", error);
      alert("An error occurred while building Sphinx documentation.");
    }
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
  
  
//     const headerSeparator = columnWidths.map((width) => "=".repeat(width)).join("+");
//     const rowSeparator = columnWidths.map((width) => "-".repeat(width)).join("+");
  
//     let result = `+${rowSeparator}+\n`;
//     result += `|` + table[0]
//       .map((cell, index) => ` ${cell}${" ".repeat(columnWidths[index] - cell.length - 2)} `)
//       .join("|") + `|\n`;
//     result += `+${headerSeparator}+\n`;
  
//     for (let i = 1; i < table.length; i++) {
//       result += `|` + table[i]
//         .map((cell, index) => ` ${cell}${" ".repeat(columnWidths[index] - cell.length - 2)} `)
//         .join("|") + `|\n`;
//       result += `+${rowSeparator}+\n`;
//     }
  
//     return result;
//   };

  // const createSimpleTable = (table) => {
  //   let columnWidths = table[0].map(
  //     (_, colIndex) => Math.max(...table.map((row) => row[colIndex].length)) + 2
  //   );

  //   const headerSeparator = columnWidths.map((width) => "=".repeat(width)).join("+");
  //   const rowSeparator = columnWidths.map((width) => "-".repeat(width)).join("+");
  
  //   let result = `+${rowSeparator}+\n`;
  //   result += `|` + table[0]
  //     .map((cell, index) => ` ${cell}${" ".repeat(columnWidths[index] - cell.length - 2)} `)
  //     .join("|") + `|\n`;
  //   result += `+${headerSeparator}+\n`;
  //   for (let i = 1; i < table.length; i++) {
  //     result += `|` + table[i]
  //       .map((cell, index) => ` ${cell}${" ".repeat(columnWidths[index] - cell.length - 2)} `)
  //       .join("|") + `|\n`;
  //     result += `+${rowSeparator}+\n`;
  //   }
  //   return result;
  // };

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
                name="rows_csv"
                label="Number of Rows"
                rules={[
                  { required: true, message: "Please input the number of rows!" },
                ]}
              >
                <InputNumber min={1} />
              </Form.Item>
              <Form.Item
                name="columns_csv"
                label="Number of Columns"
                rules={[
                  { required: true, message: "Please input the number of columns!" },
                ]}
              >
                <InputNumber min={1} />
              </Form.Item>
            </>
          );
  
          case "csv-table-edit":
      return (
        <>
          <Button type="dashed" onClick={addCsvRow} style={{ marginBottom: '10px' }}>Add Row</Button>
          <Button type="dashed" onClick={addCsvColumn} style={{ marginBottom: '10px' }}>Add Column</Button>
          <Button type="dashed" onClick={removeLastCsvRow} style={{ marginBottom: '10px' }}>Remove Row</Button>
          <Button type="dashed" onClick={removeLastCsvColumn} style={{ marginBottom: '10px' }}>Remove Column</Button>
          <Form.Item
            name="table_title"
            label="Table Title"
            rules={[{ required: true, message: "Please input the table title!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Header">
            <Input.Group compact>
              {Array.from({ length: csvColumns }).map((_, colIndex) => (
                <Form.Item
                  key={colIndex}
                  name={['header', colIndex]}
                  style={{
                    display: "inline-block",
                    width: `calc(100% / ${csvColumns})`,
                    margin: 0,
                  }}
                >
                  <Input placeholder={`Header ${colIndex + 1}`} />
                </Form.Item>
              ))}
            </Input.Group>
          </Form.Item>
          <Form.Item label="Column Widths">
            <Input.Group compact>
              {Array.from({ length: csvColumns }).map((_, colIndex) => (
                <Form.Item
                  key={colIndex}
                  name={['widths', colIndex]}
                  style={{
                    display: "inline-block",
                    width: `calc(100% / ${csvColumns})`,
                    margin: 0,
                  }}
                >
                  <Input placeholder={`Width ${colIndex + 1}`} />
                </Form.Item>
              ))}
            </Input.Group>
          </Form.Item>
          {Array.from({ length: csvRows }).map((_, rowIndex) => (
            <Form.Item key={rowIndex} label={`Row ${rowIndex + 1}`}>
              <Input.Group compact>
                {Array.from({ length: csvColumns }).map((_, colIndex) => (
                  <Form.Item
                    key={colIndex}
                    name={['table_content', rowIndex, colIndex]}
                    style={{
                      display: "inline-block",
                      width: `calc(100% / ${csvColumns})`,
                      margin: 0,
                    }}
                  >
                    <Input placeholder={`Cell ${rowIndex + 1}-${colIndex + 1}`} />
                  </Form.Item>
                ))}
              </Input.Group>
            </Form.Item>
          ))}
        </>
      );

      case "needbar":
        return (
          <>
            <Form.Item
              name="bar_title"
              label="Bar title"
              rules={[{ required: false, message: "Please input the bar header!" }]}
            >
              <Input.TextArea />
            </Form.Item>

            <Form.Item
              name="bar_values"
              label="Bar Values (one per line)"
              rules={[{ required: true, message: "Please input the bar values!" }]}
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
              rules={[{ required: false, message: "Please input the tags!" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="status"
              label="Status (comma-separated)"
              rules={[{ required: false, message: "Please input the status!" }]}
            >
              <Input />
            </Form.Item>
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

      case "grid_table":
        return (
          <>
            <Form.Item
              name="rows"
              label="Number of Rows"
              rules={[
                { required: true, message: "Please input the number of rows!" },
              ]}
            >
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item
              name="columns"
              label="Number of Columns"
              rules={[
                { required: true, message: "Please input the number of columns!" },
              ]}
            >
              <InputNumber min={1} />
            </Form.Item>
          </>
        );

        case "grid_table_edit":
          return (
            <>
              <Button type="dashed" onClick={addRow} style={{ marginBottom: '10px' }}>Add Row</Button>
              <Button type="dashed" onClick={addColumn} style={{ marginBottom: '10px' }}>Add Column</Button>
              <Button type="dashed" onClick={removeLastRow} style={{ marginBottom: '10px' }}>Remove Row</Button>
              <Button type="dashed" onClick={removeLastColumn} style={{ marginBottom: '10px' }}>Remove Column</Button>
              <Form.List name="table" initialValue={gridTable}>
                {(fields, { add, remove }) => (
                  <>
                    <Form.Item label="Header">
                      <Input.Group compact>
                        {Array.from({ length: gridColumns }).map((_, colIndex) => (
                          <Form.Item
                            key={colIndex}
                            name={[0, colIndex]}
                            style={{
                              display: "inline-block",
                              width: `calc(100% / ${gridColumns})`,
                              margin: 0,
                            }}
                          >
                            <Input placeholder={`Header ${colIndex + 1}`} />
                          </Form.Item>
                        ))}
                      </Input.Group>
                    </Form.Item>
                    {Array.from({ length: gridRows - 1 }).map((_, rowIndex) => (
                      <Form.Item key={rowIndex + 1} label={`Row ${rowIndex + 1}`}>
                        <Input.Group compact>
                          {Array.from({ length: gridColumns }).map((_, colIndex) => (
                            <Form.Item
                              key={colIndex}
                              name={[rowIndex + 1, colIndex]}
                              style={{
                                display: "inline-block",
                                width: `calc(100% / ${gridColumns})`,
                                margin: 0,
                              }}
                            >
                              <Input placeholder={`Cell ${rowIndex + 1}-${colIndex + 1}`} />
                            </Form.Item>
                          ))}
                        </Input.Group>
                      </Form.Item>
                    ))}
                  </>
                )}
              </Form.List>
            </>
          );
      

      // case "simple_table_edit":
      //       return (
      //         <Form.List name="table" initialValue={simpleTable}>
      //           {(fields, { add, remove }) => (
      //             <>
      //               <Form.Item label="Header">
      //                 <Input.Group compact>
      //                   {Array.from({ length: simpleColumns }).map((_, colIndex) => (
      //                     <Form.Item
      //                       key={colIndex}
      //                       name={[fields[0].name, colIndex]}
      //                       style={{
      //                         display: "inline-block",
      //                         width: `calc(100% / ${simpleColumns})`,
      //                         margin: 0,
      //                       }}
      //                     >
      //                       <Input placeholder={`Header ${colIndex + 1}`} />
      //                     </Form.Item>
      //                   ))}
      //                 </Input.Group>
      //               </Form.Item>
      //               {fields.slice(1).map((field, rowIndex) => (
      //                 <Form.Item key={rowIndex + 1} label={`Row ${rowIndex + 1}`}>
      //                   <Input.Group compact>
      //                     {Array.from({ length: simpleColumns }).map((_, colIndex) => (
      //                       <Form.Item
      //                         key={colIndex}
      //                         name={[field.name, colIndex]}
      //                         style={{
      //                           display: "inline-block",
      //                           width: `calc(100% / ${gridColumns})`,
      //                           margin: 0,
      //                         }}
      //                       >
      //                         <Input placeholder={`Cell ${rowIndex + 1}-${colIndex + 1}`} />
      //                       </Form.Item>
      //                     ))}
      //                   </Input.Group>
      //                 </Form.Item>
      //               ))}
      //             </>
      //           )}
      //         </Form.List>
      //       );

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
