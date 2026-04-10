"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { CodeBlock } from "./code-block"
import { cn } from "@/lib/Utils"

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-sm max-w-none dark:prose-invert", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node: _, inline, className, children, ...props }: { node?: unknown; inline?: boolean; className?: string; children?: React.ReactNode }) {
            const match = /language-(\w+)/.exec(className || "")
            const language = match ? match[1] : "text"
            const code = String(children).replace(/\n$/, "")

            if (inline) {
              return (
                <code
                  className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              )
            }

            return <CodeBlock code={code} language={language} />
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto">
                <table className="border-collapse border border-gray-300 dark:border-gray-700">
                  {children}
                </table>
              </div>
            )
          },
          th({ children }) {
            return (
              <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800">
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
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
