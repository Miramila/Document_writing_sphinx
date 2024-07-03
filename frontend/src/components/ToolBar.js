import React from "react";
import { Button, Divider, Flex, Input, Space, Typography } from "antd";
import { DownloadOutlined } from "@ant-design/icons";

const ToolBar = () => {
  const { TextArea } = Input;

  return (
    <div className="flex h-screen bg-gray-200">
        <div className="w-1/4 p-4 border-r border-gray-300 bg-gray-100">
    <Typography.Title level={1}>Sphinx RST Generator</Typography.Title>

      <Typography.Title level={5}>Add Title</Typography.Title>
      <Space>
        <Input placeholder="please enter the title " />
        <Button type="primary">Submit</Button>
      </Space>
      <Divider />

      <Typography.Title level={5}>Add Content</Typography.Title>
      <Space>
        <TextArea rows={1} placeholder="please enter the content" maxLength={6} />
        <Button type="primary">Submit</Button>
      </Space>
    <Divider />

    <Typography.Title level={5}>Add Reference</Typography.Title>
      <Space>
      <Input placeholder="reference name " />
      <Input placeholder="reference link" />

        <Button type="primary">Submit</Button>
      </Space>
    <Divider />


    </div>

    <div className="flex flex-col w-3/4 p-4 bg-gray-50">
        <Flex className="h-1/2">
    <Button type="primary" shape="round" icon={<DownloadOutlined />} size={"large"}>
            Download
          </Button>
          </Flex>

    </div>
    </div>
  );
};

export default ToolBar;

