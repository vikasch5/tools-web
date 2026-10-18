import type { TextToolDefinition } from "../types";
import { indentOption, privacyFaq } from "./shared";

export const sqlFormatter: TextToolDefinition = {
  workspace: "text",
  slug: "sql-formatter",
  category: "developer-tools",
  name: "SQL Formatter",
  metaTitle: "SQL Formatter – Beautify SQL Queries Online",
  description:
    "Format messy SQL into readable, consistently indented queries. Supports standard SQL, MySQL, PostgreSQL, SQL Server and SQLite.",
  engine: "sql",
  actions: [{ id: "format", label: "Format" }],
  options: [
    {
      type: "segmented",
      id: "dialect",
      label: "Dialect",
      choices: [
        { value: "sql", label: "Standard" },
        { value: "mysql", label: "MySQL" },
        { value: "postgresql", label: "PostgreSQL" },
        { value: "tsql", label: "SQL Server" },
        { value: "sqlite", label: "SQLite" },
      ],
      default: "sql",
    },
    {
      type: "segmented",
      id: "keywordCase",
      label: "Keywords",
      choices: [
        { value: "upper", label: "UPPER" },
        { value: "lower", label: "lower" },
        { value: "preserve", label: "As typed" },
      ],
      default: "upper",
    },
    indentOption,
  ],
  language: "SQL",
  accept: [".sql", ".txt"],
  downloadExtension: "sql",
  sample:
    "select o.id, o.created_at, c.name as customer, sum(i.quantity * i.unit_price) as total from orders o join customers c on c.id = o.customer_id left join order_items i on i.order_id = o.id where o.status in ('paid', 'shipped') and o.created_at >= '2026-01-01' group by o.id, o.created_at, c.name having sum(i.quantity * i.unit_price) > 100 order by total desc limit 20;",
  howTo: [
    "Paste a query into the input panel, open a .sql file, or load the sample. It is formatted straight away.",
    "Pick the dialect your database uses so its syntax (backticks, square brackets, :: casts and so on) is understood.",
    "Choose how keywords are written and the indent size. The output updates when you change an option.",
    "If the query cannot be parsed, the status bar shows the line and column. Use “Go to error” to jump to it.",
    "Copy the result or download it as a .sql file.",
  ],
  examples: [
    {
      title: "Break a one-line query into clauses",
      input: "select id, name from users where active = 1 order by name",
      output: "SELECT\n  id,\n  name\nFROM\n  users\nWHERE\n  active = 1\nORDER BY\n  name",
    },
    {
      title: "Indent a subquery",
      input: "select * from orders where customer_id in (select id from customers where country = 'NL')",
      output: "SELECT\n  *\nFROM\n  orders\nWHERE\n  customer_id IN (\n    SELECT\n      id\n    FROM\n      customers\n    WHERE\n      country = 'NL'\n  )",
    },
  ],
  limitations: [
    "Formatting only: the query is not run or checked against your schema, so a misspelt table name is not reported.",
    "Comments are kept, but their position may move to the start of the line.",
    "Vendor-specific procedural code (PL/pgSQL bodies, T-SQL control flow) is formatted as plain statements and may not look ideal.",
  ],
  faq: [
    {
      question: "Which SQL dialects are supported?",
      answer:
        "Standard SQL, MySQL (also fine for MariaDB), PostgreSQL, SQL Server (T-SQL) and SQLite. Choosing the right dialect matters for quoting rules and operators that only some databases have.",
    },
    {
      question: "Does formatting change what my query does?",
      answer:
        "No. Only whitespace, line breaks and, if you choose, the case of keywords change. Identifiers, strings and values are left exactly as written.",
    },
    {
      question: "Can I format several statements at once?",
      answer: "Yes. Separate them with semicolons and each statement is formatted in turn, with a blank line between them.",
    },
    privacyFaq,
  ],
  related: ["json-formatter", "js-formatter", "csv-to-json"],
};
