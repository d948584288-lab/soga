"use client"

import { memo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
interface MarkdownProps {
  content: string
  className?: string
}

export const Markdown = memo(function Markdown({ content }: MarkdownProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 代码块
          code({ className: codeClassName, children, ...props }) {
            const match = /language-(\w+)/.exec(codeClassName || "")
            const language = match ? match[1] : ""
            const isInline = !codeClassName

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm font-mono text-gray-800 dark:text-gray-200"
                  {...props}
                >
                  {children}
                </code>
              )
            }

            return (
              <div className="my-4 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-gray-400 text-xs">
                  <span>{language || "text"}</span>
                </div>
                <SyntaxHighlighter
                  language={language || "text"}
                  style={oneDark}
                  customStyle={{
                    margin: 0,
                    padding: "1rem",
                    fontSize: "0.875rem",
                    lineHeight: "1.5",
                  }}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              </div>
            )
          },

          // 段落
          p({ children }) {
            return <p className="mb-4 last:mb-0 leading-7">{children}</p>
          },

          // 标题
          h1({ children }) {
            return <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>
          },
          h2({ children }) {
            return <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>
          },
          h3({ children }) {
            return <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>
          },

          // 列表
          ul({ children }) {
            return <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>
          },
          ol({ children }) {
            return <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>
          },
          li({ children }) {
            return <li className="leading-7">{children}</li>
          },

          // 引用
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-700 dark:text-gray-300 mb-4">
                {children}
              </blockquote>
            )
          },

          // 表格
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border border-gray-300 dark:border-gray-700">
                  {children}
                </table>
              </div>
            )
          },
          thead({ children }) {
            return <thead className="bg-gray-100 dark:bg-gray-800">{children}</thead>
          },
          th({ children }) {
            return (
              <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left font-semibold">
                {children}
              </th>
            )
          },
          td({ children }) {
            return (
              <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                {children}
              </td>
            )
          },

          // 链接
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {children}
              </a>
            )
          },

          // 分割线
          hr() {
            return <hr className="my-6 border-gray-300 dark:border-gray-700" />
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})
