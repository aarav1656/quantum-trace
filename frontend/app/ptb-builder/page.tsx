'use client'

import { useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  EyeIcon,
  CogIcon,
  CodeBracketIcon,
  BoltIcon,
} from '@heroicons/react/24/outline'
import { PTBNode } from '@/components/ptb-builder/PTBNode'
import { PTBCanvas } from '@/components/ptb-builder/PTBCanvas'
import { PTBToolbox } from '@/components/ptb-builder/PTBToolbox'
import { PTBProperties } from '@/components/ptb-builder/PTBProperties'
import { PTBPreview } from '@/components/ptb-builder/PTBPreview'
import { PTBCodeView } from '@/components/ptb-builder/PTBCodeView'
import { usePTBBuilder } from '@/hooks/usePTBBuilder'
import { PTBNodeType, PTBNode as PTBNodeType_Interface } from '@/types/ptb'
import toast from 'react-hot-toast'

export default function PTBBuilderPage() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<PTBNodeType_Interface | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const canvasRef = useRef<HTMLDivElement>(null)

  const {
    nodes,
    connections,
    addNode,
    removeNode,
    updateNode,
    addConnection,
    removeConnection,
    executeTransaction,
    exportPTB,
    importPTB,
    validatePTB,
  } = usePTBBuilder()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    // Handle dropping from toolbox to canvas
    if (active.id.toString().startsWith('toolbox-')) {
      const nodeType = active.id.toString().replace('toolbox-', '')
      const rect = canvasRef.current?.getBoundingClientRect()

      if (rect) {
        const position = {
          x: event.delta.x - rect.left + 100,
          y: event.delta.y - rect.top + 100,
        }

        addNode({
          id: `node_${Date.now()}`,
          type: nodeType as any,
          position
        })
        toast.success(`Added ${nodeType} node`)
      }
    }

    // Handle reordering existing nodes
    if (active.id !== over.id) {
      const oldIndex = nodes.findIndex((node) => node.id === active.id)
      const newIndex = nodes.findIndex((node) => node.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        // Reorder nodes logic would go here
      }
    }

    setActiveId(null)
  }, [nodes, addNode])

  const handleNodeSelect = useCallback((node: PTBNodeType_Interface) => {
    setSelectedNode(node)
  }, [])

  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<PTBNodeType_Interface>) => {
    updateNode(nodeId, updates)
    if (selectedNode?.id === nodeId) {
      setSelectedNode({ ...selectedNode, ...updates })
    }
  }, [updateNode, selectedNode])

  const handleExecute = async () => {
    try {
      setIsRunning(true)
      setIsPaused(false)

      // Validate PTB first
      const validation = await validatePTB()
      if (!validation.valid) {
        toast.error(`Validation failed: ${validation.errors.join(', ')}`)
        setIsRunning(false)
        return
      }

      // Execute the transaction
      const result = await executeTransaction()

      if (result.success) {
        toast.success('Transaction executed successfully!')
        toast.success(`Transaction Hash: ${result.txHash}`)
      } else {
        toast.error(`Execution failed: ${result.error}`)
      }
    } catch (error) {
      console.error('PTB execution error:', error)
      toast.error('Failed to execute transaction')
    } finally {
      setIsRunning(false)
      setIsPaused(false)
    }
  }

  const handlePause = () => {
    setIsPaused(!isPaused)
    toast(isPaused ? 'Execution resumed' : 'Execution paused')
  }

  const handleStop = () => {
    setIsRunning(false)
    setIsPaused(false)
    toast('Execution stopped')
  }

  const handleSave = async () => {
    try {
      const ptbData = await exportPTB()
      const blob = new Blob([JSON.stringify(ptbData, null, 2)], {
        type: 'application/json'
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ptb-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('PTB exported successfully!')
    } catch (error) {
      toast.error('Failed to export PTB')
    }
  }

  const handleLoad = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const ptbData = JSON.parse(text)
        await importPTB(ptbData)
        toast.success('PTB imported successfully!')
      } catch (error) {
        toast.error('Failed to import PTB')
      }
    }
    input.click()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              {/* Left - Title */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-3"
              >
                <BoltIcon className="h-8 w-8 text-purple-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                    Programmable Transaction Builder
                  </h1>
                  <p className="text-sm text-gray-500">
                    Visual blockchain programming for IOTA
                  </p>
                </div>
              </motion.div>

              {/* Center - Execution Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExecute}
                  disabled={isRunning || nodes.length === 0}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isRunning
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  <PlayIcon className="h-5 w-5" />
                  <span>{isRunning ? 'Running...' : 'Execute'}</span>
                </button>

                {isRunning && (
                  <>
                    <button
                      onClick={handlePause}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium bg-yellow-600 hover:bg-yellow-700 text-white transition-colors"
                    >
                      <PauseIcon className="h-5 w-5" />
                      <span>{isPaused ? 'Resume' : 'Pause'}</span>
                    </button>

                    <button
                      onClick={handleStop}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                    >
                      <StopIcon className="h-5 w-5" />
                      <span>Stop</span>
                    </button>
                  </>
                )}
              </div>

              {/* Right - Actions */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowPreview(true)}
                  className="btn-outline flex items-center space-x-2"
                >
                  <EyeIcon className="h-5 w-5" />
                  <span>Preview</span>
                </button>

                <button
                  onClick={() => setShowCode(!showCode)}
                  className="btn-outline flex items-center space-x-2"
                >
                  <CodeBracketIcon className="h-5 w-5" />
                  <span>Code</span>
                </button>

                <button
                  onClick={handleLoad}
                  className="btn-outline flex items-center space-x-2"
                >
                  <CloudArrowUpIcon className="h-5 w-5" />
                  <span>Load</span>
                </button>

                <button
                  onClick={handleSave}
                  className="btn-primary flex items-center space-x-2"
                >
                  <CloudArrowDownIcon className="h-5 w-5" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Left Sidebar - Toolbox */}
          <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
            <PTBToolbox />
          </div>

          {/* Main Canvas Area */}
          <div className="flex-1 flex flex-col">
            {showCode && (
              <div className="h-1/2 border-b border-gray-200">
                <PTBCodeView nodes={nodes} connections={connections} />
              </div>
            )}

            <div ref={canvasRef} className="flex-1 relative">
              <SortableContext items={nodes.map(n => n.id)} strategy={rectSortingStrategy}>
                <PTBCanvas
                  nodes={nodes}
                  connections={connections}
                  selectedNode={selectedNode}
                  onNodeSelect={handleNodeSelect}
                  onNodeUpdate={handleNodeUpdate}
                  onNodeDelete={removeNode}
                  onConnectionAdd={addConnection}
                  onConnectionDelete={removeConnection}
                  isExecuting={isRunning}
                  isPaused={isPaused}
                />
              </SortableContext>

              <DragOverlay>
                {activeId ? (
                  <PTBNode
                    node={nodes.find(n => n.id === activeId)}
                    isSelected={false}
                    isExecuting={false}
                    onSelect={() => {}}
                    onUpdate={() => {}}
                    onDelete={() => {}}
                  />
                ) : null}
              </DragOverlay>
            </div>
          </div>

          {/* Right Sidebar - Properties */}
          {selectedNode && (
            <div className="w-80 bg-white border-l border-gray-200 flex-shrink-0">
              <PTBProperties
                node={selectedNode}
                onUpdate={(updates: Partial<PTBNodeType_Interface>) => handleNodeUpdate(selectedNode.id, updates)}
              />
            </div>
          )}
        </DndContext>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <PTBPreview
          nodes={nodes}
          connections={connections}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Status Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span>Nodes: {nodes.length}</span>
          <span>Connections: {connections.length}</span>
          {selectedNode && (
            <span>Selected: {selectedNode.type}</span>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {isRunning && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>{isPaused ? 'Paused' : 'Executing'}</span>
            </div>
          )}
          <span>IOTA PTB v1.0</span>
        </div>
      </div>
    </div>
  )
}