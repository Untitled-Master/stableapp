import { useMemo } from 'react'
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Table2 } from 'lucide-react'

const NODE_WIDTH = 264
const HEADER_HEIGHT = 46
const ROW_HEIGHT = 28
const NODE_FOOTER = 12
const COLUMN_GAP = 110
const ROW_GAP = 56

function TableNode({ data }) {
  const { table, relations, onOpen } = data
  return (
    <div
      className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm"
      style={{ width: NODE_WIDTH }}
    >
      <button
        onClick={() => onOpen(table.name)}
        title={`Open ${table.name}`}
        className="flex w-full items-center gap-2 border-b bg-muted/40 px-3 text-left hover:bg-accent"
        style={{ height: HEADER_HEIGHT }}
      >
        <Table2 className="size-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{table.name}</span>
        <span className="shrink-0 text-xs text-muted-foreground">{table.columns.length} cols</span>
      </button>
      <div style={{ paddingBottom: NODE_FOOTER }}>
        {table.columns.map((column) => {
          const relation = relations.find(
            (item) => item.fromTable === table.name && item.fromColumn === column.name,
          )
          return (
            <div
              key={column.name}
              className="relative flex items-center gap-2 px-3 text-xs"
              style={{ height: ROW_HEIGHT }}
            >
              <Handle
                type="target"
                position={Position.Left}
                id={`in:${column.name}`}
                style={{ top: ROW_HEIGHT / 2 }}
              />
              <span className="min-w-0 flex-1 truncate font-medium" title={column.name}>
                {column.name}
              </span>
              <span className="max-w-24 truncate font-mono text-muted-foreground" title={column.type}>
                {column.type}
              </span>
              {column.key === 'PRI' && (
                <span title="Primary key" className="shrink-0 rounded bg-amber-500/10 px-1.5 py-0.5 font-semibold text-amber-600">
                  PK
                </span>
              )}
              {relation && (
                <span
                  title={`References ${relation.toTable}.${relation.toColumn}`}
                  className="shrink-0 rounded bg-blue-500/10 px-1.5 py-0.5 font-semibold text-blue-600"
                >
                  FK
                </span>
              )}
              <Handle
                type="source"
                position={Position.Right}
                id={`out:${column.name}`}
                style={{ top: ROW_HEIGHT / 2 }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

const nodeTypes = { table: TableNode }

function nodeHeight(table) {
  return HEADER_HEIGHT + table.columns.length * ROW_HEIGHT + NODE_FOOTER
}

function layoutNodes(tables, relationships) {
  const names = new Set(tables.map((table) => table.name))
  const outgoing = new Map()
  relationships.forEach((relation) => {
    if (!names.has(relation.fromTable) || !names.has(relation.toTable)) return
    if (!outgoing.has(relation.fromTable)) outgoing.set(relation.fromTable, new Set())
    outgoing.get(relation.fromTable).add(relation.toTable)
  })

  const depthCache = new Map()
  const visiting = new Set()
  const depthOf = (name) => {
    if (depthCache.has(name)) return depthCache.get(name)
    if (visiting.has(name)) return 0
    visiting.add(name)
    const refs = [...(outgoing.get(name) || [])].filter((ref) => ref !== name)
    const depth = refs.length === 0 ? 0 : 1 + Math.max(...refs.map(depthOf))
    visiting.delete(name)
    depthCache.set(name, depth)
    return depth
  }

  const columns = new Map()
  tables.forEach((table) => {
    const depth = depthOf(table.name)
    if (!columns.has(depth)) columns.set(depth, [])
    columns.get(depth).push(table)
  })

  const nodes = []
  ;[...columns.keys()].sort((a, b) => a - b).forEach((depth) => {
    let y = 0
    columns.get(depth).forEach((table) => {
      nodes.push({
        id: table.name,
        type: 'table',
        position: { x: depth * (NODE_WIDTH + COLUMN_GAP), y },
        data: { table },
      })
      y += nodeHeight(table) + ROW_GAP
    })
  })
  return nodes
}

function buildEdges(tables, relationships, dark) {
  const columnsByTable = new Map(tables.map((table) => [table.name, new Set(table.columns.map((column) => column.name))]))
  const stroke = dark ? '#7aaaff' : '#4176e6'
  return relationships.flatMap((relation, index) => {
    if (!columnsByTable.has(relation.fromTable) || !columnsByTable.has(relation.toTable)) return []
    if (!columnsByTable.get(relation.fromTable).has(relation.fromColumn)) return []
    const edge = {
      id: `${relation.fromTable}.${relation.fromColumn}->${relation.toTable}.${relation.toColumn}#${index}`,
      source: relation.fromTable,
      sourceHandle: `out:${relation.fromColumn}`,
      target: relation.toTable,
      type: 'smoothstep',
      label: `${relation.fromColumn} → ${relation.toColumn}`,
      labelStyle: { fontSize: 10 },
      labelBgPadding: [6, 3],
      labelBgBorderRadius: 6,
      markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: stroke },
      style: { strokeWidth: 1.5, stroke },
    }
    if (columnsByTable.get(relation.toTable).has(relation.toColumn)) {
      edge.targetHandle = `in:${relation.toColumn}`
    }
    return [edge]
  })
}

export function SchemaCanvas({ tables, relationships, dark = false, onOpenTable }) {
  const { nodes, edges } = useMemo(() => {
    const laidOut = layoutNodes(tables, relationships)
    const withCallbacks = laidOut.map((node) => ({
      ...node,
      data: { ...node.data, relations: relationships, onOpen: onOpenTable },
    }))
    return { nodes: withCallbacks, edges: buildEdges(tables, relationships, dark) }
  }, [tables, relationships, dark, onOpenTable])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      colorMode={dark ? 'dark' : 'light'}
      fitView
      fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
      minZoom={0.2}
      maxZoom={1.75}
      nodesConnectable={false}
      proOptions={{ hideAttribution: false }}
    >
      <Background gap={24} />
      <Controls showInteractive={false} />
      <MiniMap pannable zoomable />
    </ReactFlow>
  )
}
