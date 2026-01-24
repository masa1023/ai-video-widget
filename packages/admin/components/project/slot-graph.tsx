'use client'

import { useMemo } from 'react'
import type { Slot, SlotTransition } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { X, Play, Clock, MousePointer, ArrowRight } from 'lucide-react'

type SlotGraphProps = {
  slots: Slot[]
  transitions: SlotTransition[]
  onDeleteTransition: (id: string) => void
}

type Position = { x: number; y: number }

export function SlotGraph({ slots, transitions, onDeleteTransition }: SlotGraphProps) {
  const { positions, width, height } = useMemo(() => {
    // Simple layout algorithm: arrange in layers based on entry point
    const entrySlot = slots.find(s => s.is_entry_point)
    if (!entrySlot || slots.length === 0) {
      return { positions: new Map<string, Position>(), width: 400, height: 200 }
    }

    const positions = new Map<string, Position>()
    const visited = new Set<string>()
    const layers: string[][] = []
    
    // BFS to create layers
    const queue: { id: string; layer: number }[] = [{ id: entrySlot.id, layer: 0 }]
    visited.add(entrySlot.id)
    
    while (queue.length > 0) {
      const { id, layer } = queue.shift()!
      if (!layers[layer]) layers[layer] = []
      layers[layer].push(id)
      
      // Find connected slots
      const outgoing = transitions.filter(t => t.from_slot_id === id)
      for (const t of outgoing) {
        if (!visited.has(t.to_slot_id)) {
          visited.add(t.to_slot_id)
          queue.push({ id: t.to_slot_id, layer: layer + 1 })
        }
      }
    }
    
    // Add any unvisited slots to the last layer
    for (const slot of slots) {
      if (!visited.has(slot.id)) {
        const lastLayer = layers.length > 0 ? layers.length - 1 : 0
        if (!layers[lastLayer]) layers[lastLayer] = []
        layers[lastLayer].push(slot.id)
      }
    }
    
    // Calculate positions
    const nodeWidth = 180
    const nodeHeight = 60
    const horizontalGap = 80
    const verticalGap = 60
    
    const totalWidth = layers.length * (nodeWidth + horizontalGap)
    
    layers.forEach((layer, layerIndex) => {
      const layerHeight = layer.length * (nodeHeight + verticalGap)
      layer.forEach((slotId, nodeIndex) => {
        positions.set(slotId, {
          x: layerIndex * (nodeWidth + horizontalGap) + nodeWidth / 2 + 20,
          y: nodeIndex * (nodeHeight + verticalGap) + nodeHeight / 2 + 20 + (200 - layerHeight) / 2,
        })
      })
    })
    
    const maxY = Math.max(...Array.from(positions.values()).map(p => p.y)) + nodeHeight / 2 + 40
    
    return { 
      positions, 
      width: Math.max(totalWidth + 40, 400),
      height: Math.max(maxY, 200)
    }
  }, [slots, transitions])

  if (slots.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Add slots to visualize your video flow
      </div>
    )
  }

  const getSlotName = (id: string) => slots.find(s => s.id === id)?.name || 'Unknown'

  return (
    <div className="relative overflow-auto">
      <svg width={width} height={height} className="min-w-full">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" className="fill-muted-foreground" />
          </marker>
        </defs>
        
        {/* Draw transitions */}
        {transitions.map((t) => {
          const from = positions.get(t.from_slot_id)
          const to = positions.get(t.to_slot_id)
          if (!from || !to) return null
          
          const dx = to.x - from.x
          const dy = to.y - from.y
          const len = Math.sqrt(dx * dx + dy * dy)
          
          // Offset from center of nodes
          const nodeRadius = 40
          const startX = from.x + (dx / len) * nodeRadius
          const startY = from.y + (dy / len) * nodeRadius
          const endX = to.x - (dx / len) * (nodeRadius + 10)
          const endY = to.y - (dy / len) * (nodeRadius + 10)
          
          // Control point for curved line
          const midX = (startX + endX) / 2
          const midY = (startY + endY) / 2
          const perpX = -(endY - startY) / len * 20
          const perpY = (endX - startX) / len * 20
          
          const pathD = `M ${startX} ${startY} Q ${midX + perpX} ${midY + perpY} ${endX} ${endY}`
          
          return (
            <g key={t.id} className="group cursor-pointer">
              <path
                d={pathD}
                fill="none"
                className="stroke-muted-foreground stroke-2"
                markerEnd="url(#arrowhead)"
              />
              {/* Invisible wider path for easier clicking */}
              <path
                d={pathD}
                fill="none"
                className="stroke-transparent stroke-[20px]"
                onClick={() => onDeleteTransition(t.id)}
              />
              {/* Delete button on hover */}
              <foreignObject
                x={midX + perpX - 12}
                y={midY + perpY - 12}
                width={24}
                height={24}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <button
                  type="button"
                  onClick={() => onDeleteTransition(t.id)}
                  className="w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                >
                  <X className="h-3 w-3" />
                </button>
              </foreignObject>
              {/* Trigger type indicator */}
              <foreignObject
                x={midX + perpX - 10}
                y={midY + perpY + 10}
                width={20}
                height={20}
                className="pointer-events-none"
              >
                <div className="w-5 h-5 rounded-full bg-background border flex items-center justify-center">
                  {t.trigger_type === 'time' && <Clock className="h-3 w-3" />}
                  {t.trigger_type === 'click' && <MousePointer className="h-3 w-3" />}
                  {t.trigger_type === 'auto' && <ArrowRight className="h-3 w-3" />}
                </div>
              </foreignObject>
            </g>
          )
        })}
        
        {/* Draw slots */}
        {slots.map((slot) => {
          const pos = positions.get(slot.id)
          if (!pos) return null
          
          return (
            <g key={slot.id}>
              <rect
                x={pos.x - 80}
                y={pos.y - 25}
                width={160}
                height={50}
                rx={8}
                className={`${slot.is_entry_point ? 'fill-primary/10 stroke-primary stroke-2' : 'fill-card stroke-border'}`}
              />
              {slot.is_entry_point && (
                <foreignObject x={pos.x - 75} y={pos.y - 18} width={16} height={16}>
                  <Play className="h-4 w-4 text-primary" />
                </foreignObject>
              )}
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground text-sm font-medium"
              >
                {slot.name.length > 18 ? slot.name.slice(0, 18) + '...' : slot.name}
              </text>
            </g>
          )
        })}
      </svg>
      
      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <ArrowRight className="h-3 w-3" />
          <span>Auto</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Time-based</span>
        </div>
        <div className="flex items-center gap-1">
          <MousePointer className="h-3 w-3" />
          <span>Click</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-2 border-primary bg-primary/10" />
          <span>Entry Point</span>
        </div>
      </div>
    </div>
  )
}
