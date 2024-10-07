import React, { useState, useRef } from "react";
import { Form, Input, InputNumber, Checkbox, Button } from "antd";
const { TextArea } = Input;

const ModalForm = ({
  form,
  modalType,
  addCsvRow,
  addCsvColumn,
  removeLastCsvRow,
  removeLastCsvColumn,
  csvColumns,
  csvRows,
  addRow,
  addColumn,
  removeLastRow,
  removeLastColumn,
  gridTable,
  gridColumns,
  gridRows
  }) => {
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

export default ModalForm;