import React from 'react';
import { Menu, Button } from 'antd';
import { MailOutlined } from '@ant-design/icons';

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
      <SubMenu key="sub1" icon={<MailOutlined />} title="rst_syntax_templates">
        <SubMenu key="sub2" title="rst_role">
          <Menu.Item key="1" onClick={() => formatSelectedText("title")}>标题 Title</Menu.Item>
          <Menu.Item key="2" onClick={() => formatSelectedText("bold")}>加粗 Bold</Menu.Item>
          <Menu.Item key="3" onClick={() => formatSelectedText("italic")}>斜体 Italic</Menu.Item>
          <Menu.Item key="4" onClick={showModal}>引用 Reference</Menu.Item>
          {/* <Menu.Item key="2" >行内标记 Inline markup</Menu.Item>
          <Menu.Item key="3">源代码 Source Code</Menu.Item>
          <Menu.Item key="4">表格 Tables</Menu.Item>
          <Menu.Item key="5">超链接 Hyperlinks</Menu.Item>
  <Menu.Item key="6">超链接 Hyperlinks</Menu.Item> */}
        </SubMenu>
        <Menu.Item key="7">rst_directive</Menu.Item>
        <Menu.Item key="8">sphinx-needs_directives</Menu.Item>
        <Menu.Item key="9">customer_directives</Menu.Item>
      </SubMenu>
    </Menu>
      
  );
};

export default Sidebar;

