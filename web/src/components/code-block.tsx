"use client"

import * as React from "react"
import { codeToHtml } from "shiki"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/Utils"

interface CodeBlockProps {
  code: string
  language?: string
  className?: string
}

export function CodeBlock({ code, language = "text", className }: CodeBlockProps) {
  const [highlighted, setHighlighted] = React.useState("")
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    async function highlight() {
      const html = await codeToHtml(code, {
        lang: language,
        theme: "github-dark",
      })
      setHighlighted(html)
    }
    highlight()
  }, [code, language])

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn("relative group rounded-lg overflow-hidden", className)}>
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-gray-200 text-sm">
        <span className="font-medium">{language}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="h-8 px-2 text-gray-400 hover:text-white hover:bg-gray-700"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      {highlighted ? (
        <div
          className="text-sm overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      ) : (
        <pre className="p-4 bg-gray-900 text-gray-100 text-sm overflow-x-auto">
          {code}
        </pre>
      )}
    </div>
  )
}
