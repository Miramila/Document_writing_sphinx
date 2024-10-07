import React from 'react';
import { Menu } from 'antd';
import { ToolOutlined } from '@ant-design/icons';

const { SubMenu } = Menu;

const Sidebar = ({ formatSelectedText, showModal }) => {
  return (
    <Menu
      style={{ width: 256, height: '100vh' }}
      defaultSelectedKeys={['1']}
      defaultOpenKeys={['sub1']}
      mode="inline"
      theme="dark"
    >
      <SubMenu key="sub1" icon={<ToolOutlined />} title="RST Functions">
        <SubMenu key="sub2" title="rst_role">
          <Menu.Item key="sub2-1" onClick={() => formatSelectedText("title")}>标题 Title</Menu.Item>
          <Menu.Item key="sub2-2" onClick={() => formatSelectedText("bold")}>加粗 Bold</Menu.Item>
          <Menu.Item key="sub2-3" onClick={() => formatSelectedText("italic")}>斜体 Italic</Menu.Item>
          <Menu.Item key="sub2-4" onClick={() => showModal("external_links")}>外部引用 External links</Menu.Item>
          <Menu.Item key="sub2-5" onClick={() => showModal("internal_links")}>内部引用 Internal links</Menu.Item>
          <Menu.Item key="sub2-6" onClick={() => formatSelectedText("paragraphs")}>段落 Paragraphs</Menu.Item>
          <Menu.Item key="sub2-7" onClick={() => showModal("grid_table")}>表格 Grid table</Menu.Item>
        </SubMenu>
        
        <SubMenu key='sub3' title="rst_directive">
          <Menu.Item key="sub3-1" onClick={() => showModal("toctree")}>插入目录 Toctree</Menu.Item>
          <Menu.Item key="sub3-2" onClick={() => showModal("codeblock")}>插入代码 Code-Block</Menu.Item>
          <Menu.Item key="sub3-3" onClick={() => showModal("note")}>注意 Note</Menu.Item>
          <Menu.Item key="sub3-4" onClick={() => showModal("warning")}>警告 Warning</Menu.Item>
          <Menu.Item key="sub3-5" onClick={() => showModal("image")}>Image</Menu.Item>
          <Menu.Item key="sub3-6" onClick={() => showModal("figure")}>Figure</Menu.Item>
          <Menu.Item key="sub3-7" onClick={() => showModal("math")}>Math</Menu.Item>
          <Menu.Item key="sub3-8" onClick={() => showModal("csv-table")}>CSV-Table</Menu.Item>
        </SubMenu>
        
        <SubMenu key='sub4' title="sphinx-needs_directives">
          <Menu.Item key="sub4-1" onClick={() => showModal("needbar")}>needbar</Menu.Item>
          <Menu.Item key="sub4-2" onClick={() => showModal("needlist")}>needlist</Menu.Item>
          <Menu.Item key="sub4-3" onClick={() => showModal("needtable")}>needtable</Menu.Item>
          <Menu.Item key="sub4-4" onClick={() => showModal("needflow")}>needflow</Menu.Item>
          <Menu.Item key="sub4-5" onClick={() => showModal("needextract")}>needextract</Menu.Item>
          <Menu.Item key="sub4-6" onClick={() => showModal("needextend")}>needextend</Menu.Item>
        </SubMenu>

        <Menu.Item key="9">customer_directives</Menu.Item>
      </SubMenu>
    </Menu>
  );
};

export default Sidebar;
