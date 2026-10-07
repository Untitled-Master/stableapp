import { useEffect, useRef } from 'react'
import Editor, { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { useTranslation } from 'react-i18next'

loader.config({ monaco })

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
  'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'CREATE DATABASE', 'JOIN', 'LEFT JOIN',
  'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET', 'AND', 'OR', 'AS', 'NULL',
  'PRIMARY KEY', 'FOREIGN KEY', 'NOT NULL', 'DEFAULT', 'SHOW DATABASES', 'SHOW TABLES',
  'DESCRIBE', 'USE', 'DISTINCT', 'COUNT(*)', 'NOW()',
]

const TABLE_CONTEXT = /\b(?:FROM|JOIN|INTO|UPDATE|TABLE|DATABASE|USE)\s+[`\w$]*$/i

function quoteName(name) {
  return `\`${String(name).replaceAll('`', '``')}\``
}

export function SqlEditor({
  value,
  onChange,
  onRun,
  tables = [],
  databases = [],
  columns = [],
  database = '',
  dark = false,
  fontSize = 14,
  lineNumbers = true,
}) {
  const { t } = useTranslation()
  const onRunRef = useRef(onRun)
  useEffect(() => {
    onRunRef.current = onRun
  }, [onRun])

  const dataRef = useRef({ tables, databases, columns, database })
  useEffect(() => {
    dataRef.current = { tables, databases, columns, database }
  }, [tables, databases, columns, database])

  useEffect(() => {
    const provider = monaco.languages.registerCompletionItemProvider('sql', {
      triggerCharacters: [' ', '.', '`'],
      provideCompletionItems(model, position) {
        const { tables: dbTables, databases: dbNames, columns: dbColumns, database: dbName } = dataRef.current
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        }
        const lineBefore = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        })
        const tableContext = TABLE_CONTEXT.test(lineBefore)
        const seen = new Set()
        const suggestions = []

        const push = (label, kind, detail, sortGroup, insert) => {
          const key = `${kind}:${label}`
          if (seen.has(key)) return
          seen.add(key)
          suggestions.push({
            label,
            kind,
            detail,
            sortText: `${sortGroup}_${label}`,
            insertText: insert ?? label,
            range,
          })
        }

        if (tableContext) {
          dbTables.forEach((table) => push(table, monaco.languages.CompletionItemKind.Struct, dbName ? `Table · ${dbName}` : 'Table', '0', quoteName(table)))
          dbNames.forEach((name) => push(name, monaco.languages.CompletionItemKind.Class, 'Database', '1', quoteName(name)))
          dbColumns.forEach((column) => push(column.name, monaco.languages.CompletionItemKind.Field, `Column · ${column.table}`, '2', quoteName(column.name)))
          SQL_KEYWORDS.forEach((keyword) => push(keyword, monaco.languages.CompletionItemKind.Keyword, 'Keyword', '3'))
        } else {
          SQL_KEYWORDS.forEach((keyword) => push(keyword, monaco.languages.CompletionItemKind.Keyword, 'Keyword', '0'))
          dbTables.forEach((table) => push(table, monaco.languages.CompletionItemKind.Struct, dbName ? `Table · ${dbName}` : 'Table', '1', quoteName(table)))
          dbNames.forEach((name) => push(name, monaco.languages.CompletionItemKind.Class, 'Database', '2', quoteName(name)))
          dbColumns.forEach((column) => push(column.name, monaco.languages.CompletionItemKind.Field, `Column · ${column.table}`, '3', quoteName(column.name)))
        }

        return { suggestions }
      },
    })
    return () => provider.dispose()
  }, [])

  return (
    <Editor
      height='100%'
      language='sql'
      theme={dark ? 'vs-dark' : 'vs'}
      value={value}
      onChange={(next) => onChange(next ?? '')}
      onMount={(editor) => {
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => onRunRef.current?.())
      }}
      loading={<div className='flex min-h-[320px] items-center justify-center text-sm text-muted-foreground'>{t('editor.loading')}</div>}
      options={{
        fontSize,
        lineNumbers: lineNumbers ? 'on' : 'off',
        minimap: { enabled: false },
        wordWrap: 'on',
        automaticLayout: true,
        scrollBeyondLastLine: false,
        padding: { top: 12 },
        tabSize: 2,
        renderLineHighlight: 'all',
        smoothScrolling: true,
        suggestOnTriggerCharacters: true,
        quickSuggestions: { other: true, comments: false, strings: true },
        acceptSuggestionOnEnter: 'on',
        tabCompletion: 'on',
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
        fixedOverflowWidgets: true,
      }}
    />
  )
}
