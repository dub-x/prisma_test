import type { GetServerSideProps, NextPage } from "next";
import prisma from "../lib/prisma";
import { Book } from "@prisma/client";
import { FC, HTMLAttributes, ReactNode, useState } from "react";
import {
  Form,
  InputNumber,
  Table,
  Typography,
  Input,
  DatePicker,
  Modal,
  Button,
  notification,
} from "antd";
import { Container } from "../styles/main";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { createBook, deleteBook, getBooks, updateBook } from "../lib/rest";
import Link from "next/link";
import { AxiosError } from "axios";

interface EditableCellProps extends HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: any;
  inputType: "number" | "text" | "date";
  record: Book;
  index: number;
  children: ReactNode;
}

const EditableCell: FC<EditableCellProps> = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
  children,
  ...restProps
}) => {
  const inputNode = inputType === "number" ? <InputNumber /> : <Input />; //TODO:inputType === 'date'? <DatePicker defaultPickerValue={moment(new Date().getDate(),'DD/MM/YYYY')}/>:

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[
            {
              required: true,
              message: `Please Input ${title}!`,
            },
          ]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

interface Props {
  books: Book[];
}
interface ErrorResponseData {
  target?: string[];
}

const Home: NextPage<Props> = ({ books }) => {
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const queryClient = useQueryClient();

  const [editingKey, setEditingKey] = useState<string>("");
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const { data, isLoading } = useQuery<Book[], Error>("books", getBooks, {
    initialData: books,
  });
  const editBook = useMutation(updateBook, {
    onSuccess: () => {
      queryClient.invalidateQueries("books");
    },
  });
  const mutationCreate = useMutation(createBook, {
    onSuccess: () => {
      queryClient.invalidateQueries("books");
      createForm.resetFields();
      setIsModalVisible(false);
    },
    onError: (error: AxiosError<ErrorResponseData>) => {
      const target = error.response?.data?.target;
      if (target && target.length > 0) {
        target.forEach((e) => {
          notification["error"]({
            message: `Book with the same ${e} already exist`,
          });
        });
      }
    },
  });

  const mutationDelete = useMutation(deleteBook, {
    onSuccess: () => {
      queryClient.invalidateQueries("books");
    },
  });

  const save = async (id: string) => {
    try {
      const row = (await form.validateFields()) as Book;
      editBook.mutate({ ...row, id });
      setEditingKey("");
    } catch (errInfo) {
      console.log("Validate Failed:", errInfo);
    }
  };

  const isEditing = (record: Book) => record.id === editingKey;
  const edit = (record: Book) => {
    form.setFieldsValue({ ...record });
    setEditingKey(record.id);
  };
  const columns = [
    {
      title: "email",
      dataIndex: "email",
      width: "200px",
      editable: true,
      render: (_: any, record: Book) => (
        <Link href={record.id}>{record.email}</Link>
      ),
    },
    {
      title: "Телефон",
      width: "200px",
      dataIndex: "tel",
      editable: true,
    },
    {
      title: "Цвет",
      width: "150px",
      dataIndex: "color",
      editable: true,
    },
    {
      title: "age",
      width: "100px",
      dataIndex: "age",
      editable: true,
    },
    {
      title: "Ключ",
      width: "200px",
      dataIndex: "okey",
      editable: true,
      render: (_: any, record: Book) => <>{record.okey.slice(0, 20)}...</>,
    },
    {
      title: "Город",
      dataIndex: "city",
      width: "100px",
      editable: true,
    },
    {
      title: "Автор",
      dataIndex: "author",
      width: "200px",
      editable: true,
    },
    {
      title: "страниц",
      dataIndex: "number_of_pages",
      width: "100px",
      editable: true,
    },
    {
      title: "глав",
      width: "100px",
      dataIndex: "number_of_chapters",
      editable: true,
    },
    {
      title: "экземпляров",
      width: "100px",
      dataIndex: "number_of_published_books",
      editable: true,
    },
    {
      title: "дата создания",
      width: "200px",
      dataIndex: "date_of_creation",
      editable: true,
      render: (_: any, record: Book) => (
        <>{new Date(record.date_of_creation).toDateString()}</>
      ),
    },
    {
      dataIndex: "operation",
      width: "120px",
      render: (_: any, record: Book) => {
        const editable = isEditing(record);
        return editable ? (
          <>
            <Typography.Link
              onClick={() => save(record.id)}
              style={{ marginRight: 8 }}
            >
              Save
            </Typography.Link>
            {" / "}
            <Typography.Link
              onClick={() => setEditingKey("")}
              style={{ marginRight: 8 }}
            >
              Cancel
            </Typography.Link>
          </>
        ) : (
          <>
            <Typography.Link
              disabled={editingKey !== ""}
              onClick={() => edit(record)}
            >
              Edit
            </Typography.Link>
            {" / "}
            <Typography.Link
              disabled={editingKey !== ""}
              onClick={() => mutationDelete.mutate(record.id)}
            >
              Delete
            </Typography.Link>
          </>
        );
      },
    },
  ];

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: Book) => ({
        record,
        inputType: [
          "age",
          "number_of_pages",
          "number_of_chapters",
          "number_of_published_books",
        ].includes(col.dataIndex)
          ? "number"
          : col.dataIndex === "date_of_creation"
          ? "date"
          : "text",
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });
  return (
    <Container>
      <Modal
        title="Create"
        visible={isModalVisible}
        okText="Create"
        onCancel={() => setIsModalVisible(false)}
        onOk={() => {
          createForm
            .validateFields()
            .then((values) => {
              mutationCreate.mutate(values);
            })
            .catch((info) => {
              console.log("Validate Failed:", info);
            });
        }}
        confirmLoading={mutationCreate.isLoading}
      >
        <Form layout="horizontal" size={"large"} form={createForm}>
          <Form.Item
            name="email"
            label="email"
            rules={[
              {
                required: true,
                type: "email",
                message: "Please input the email!",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="url"
            label="url"
            rules={[
              {
                required: true,
                type: "url",
                message: "Please input the url!",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="tel"
            label="tel"
            rules={[
              {
                required: true,
                message: "Please input the telephone!",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="color"
            label="color"
            rules={[
              {
                required: true,
                message: "Please input the color!",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="okey"
            label="open key"
            rules={[
              {
                required: true,
                message: "Please input the open key of collection!",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="city"
            label="city"
            rules={[
              {
                required: true,
                message: "Please input the city!",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="author"
            label="Author"
            rules={[
              {
                required: true,
                message: "Please input the Author!",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="date_of_creation"
            label="Date of creation"
            rules={[
              {
                required: true,
                type: "date",
                message: "Please input the date!",
              },
            ]}
          >
            <DatePicker />
          </Form.Item>
          <Form.Item
            name="age"
            label="Age"
            rules={[
              {
                required: true,
                message: "Please input the Age!",
              },
            ]}
          >
            <InputNumber />
          </Form.Item>
          <Form.Item
            name="number_of_pages"
            label="number_of_pages"
            rules={[
              {
                required: true,
                message: "Please input the number_of_pages!",
              },
            ]}
          >
            <InputNumber />
          </Form.Item>
          <Form.Item
            name="number_of_chapters"
            label="number_of_chapters"
            rules={[
              {
                required: true,
                message: "Please input the number_of_chapters!",
              },
            ]}
          >
            <InputNumber />
          </Form.Item>
          <Form.Item
            name="number_of_published_books"
            label="number_of_published_books"
            rules={[
              {
                required: true,
                message: "Please input the number_of_published_books!",
              },
            ]}
          >
            <InputNumber />
          </Form.Item>
        </Form>
      </Modal>
      <Button type="primary" onClick={() => setIsModalVisible(true)}>
        Create
      </Button>
      <Form form={form} component={false}>
        <Table
          components={{
            body: {
              cell: EditableCell,
            },
          }}
          bordered
          dataSource={data}
          columns={mergedColumns}
          pagination={false}
          scroll={{ x: 1000 }}
          loading={isLoading}
        />
      </Form>
    </Container>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const books = await prisma?.book?.findMany();
  return {
    props: {
      books,
    },
  };
};

export default Home;
