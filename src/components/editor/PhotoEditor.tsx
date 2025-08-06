import React, { useEffect, useRef, useState } from 'react'
import { Canvas as FabricCanvas, Circle, Rect, FabricImage } from 'fabric'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Undo, Redo, RotateCw, FlipHorizontal, FlipVertical, 
  Download, Save, X, Palette, Sliders, Shapes, Type,
  Crop, Move, Brush, Eraser
} from 'lucide-react'
import { Photo, FilterPreset } from '@/types'
import { toast } from 'sonner'
import { saveAs } from 'file-saver'

interface PhotoEditorProps {
  photo: Photo | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (editedPhoto: Blob, metadata: any) => void
}

const filterPresets: FilterPreset[] = [
  { name: 'Original', filters: { brightness: 0, contrast: 0, saturation: 0, blur: 0, sepia: 0, grayscale: 0 } },
  { name: 'Bright', filters: { brightness: 0.2, contrast: 0.1, saturation: 0.1, blur: 0, sepia: 0, grayscale: 0 } },
  { name: 'Vintage', filters: { brightness: 0.1, contrast: -0.1, saturation: -0.2, blur: 0, sepia: 0.3, grayscale: 0 } },
  { name: 'B&W', filters: { brightness: 0, contrast: 0.1, saturation: 0, blur: 0, sepia: 0, grayscale: 1 } },
  { name: 'Sepia', filters: { brightness: 0.1, contrast: 0, saturation: -0.1, blur: 0, sepia: 0.8, grayscale: 0 } },
  { name: 'Soft', filters: { brightness: 0.1, contrast: -0.1, saturation: 0.1, blur: 1, sepia: 0, grayscale: 0 } },
]

export const PhotoEditor: React.FC<PhotoEditorProps> = ({ 
  photo, 
  open, 
  onOpenChange, 
  onSave 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null)
  const [originalImage, setOriginalImage] = useState<FabricImage | null>(null)
  const [activeFilters, setActiveFilters] = useState(filterPresets[0].filters)
  const [activeTool, setActiveTool] = useState<'select' | 'draw' | 'text' | 'shapes' | 'crop'>('select')
  const [brushSize, setBrushSize] = useState(5)
  const [brushColor, setBrushColor] = useState('#000000')

  useEffect(() => {
    if (!canvasRef.current || !photo) return

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
    })

    // Load the image
    FabricImage.fromURL(photo.file_url, {
      crossOrigin: 'anonymous'
    }).then((img) => {
      if (!img) return
      
      // Scale image to fit canvas
      const scale = Math.min(
        canvas.width! / img.width!,
        canvas.height! / img.height!
      )
      
      img.scale(scale)
      img.set({
        left: (canvas.width! - img.getScaledWidth()) / 2,
        top: (canvas.height! - img.getScaledHeight()) / 2
      })
      
      canvas.add(img)
      canvas.setActiveObject(img)
      setOriginalImage(img)
      canvas.renderAll()
    })

    setFabricCanvas(canvas)

    return () => {
      canvas.dispose()
    }
  }, [photo])

  useEffect(() => {
    if (!fabricCanvas) return

    fabricCanvas.isDrawingMode = activeTool === 'draw'
    
    if (activeTool === 'draw' && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = brushColor
      fabricCanvas.freeDrawingBrush.width = brushSize
    }
  }, [activeTool, brushColor, brushSize, fabricCanvas])

  const applyFilters = () => {
    if (!originalImage || !fabricCanvas) return

    const filters: any[] = []
    
    if (activeFilters.brightness !== 0) {
      filters.push(new (window as any).fabric.Image.filters.Brightness({
        brightness: activeFilters.brightness
      }))
    }
    
    if (activeFilters.contrast !== 0) {
      filters.push(new (window as any).fabric.Image.filters.Contrast({
        contrast: activeFilters.contrast
      }))
    }
    
    if (activeFilters.saturation !== 0) {
      filters.push(new (window as any).fabric.Image.filters.Saturation({
        saturation: activeFilters.saturation
      }))
    }
    
    if (activeFilters.blur > 0) {
      filters.push(new (window as any).fabric.Image.filters.Blur({
        blur: activeFilters.blur / 10
      }))
    }
    
    if (activeFilters.sepia > 0) {
      filters.push(new (window as any).fabric.Image.filters.Sepia())
    }
    
    if (activeFilters.grayscale > 0) {
      filters.push(new (window as any).fabric.Image.filters.Grayscale())
    }

    originalImage.filters = filters
    originalImage.applyFilters()
    fabricCanvas.renderAll()
  }

  useEffect(() => {
    applyFilters()
  }, [activeFilters, originalImage, fabricCanvas])

  const handleFilterPreset = (preset: FilterPreset) => {
    setActiveFilters(preset.filters)
  }

  const handleFilterChange = (filterName: string, value: number) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterName]: value / 100
    }))
  }

  const addShape = (type: 'rectangle' | 'circle') => {
    if (!fabricCanvas) return

    const shape = type === 'rectangle' 
      ? new Rect({
          left: 100,
          top: 100,
          fill: brushColor,
          width: 100,
          height: 100,
        })
      : new Circle({
          left: 100,
          top: 100,
          fill: brushColor,
          radius: 50,
        })

    fabricCanvas.add(shape)
    fabricCanvas.setActiveObject(shape)
    fabricCanvas.renderAll()
  }

  const addText = () => {
    if (!fabricCanvas) return

    const text = new (window as any).fabric.IText('Edit this text', {
      left: 100,
      top: 100,
      fill: brushColor,
      fontSize: 24,
      fontFamily: 'Arial'
    })

    fabricCanvas.add(text)
    fabricCanvas.setActiveObject(text)
    fabricCanvas.renderAll()
  }

  const rotate = () => {
    const activeObject = fabricCanvas?.getActiveObject()
    if (activeObject) {
      activeObject.rotate((activeObject.angle || 0) + 90)
      fabricCanvas?.renderAll()
    }
  }

  const flipHorizontal = () => {
    const activeObject = fabricCanvas?.getActiveObject()
    if (activeObject) {
      activeObject.set('flipX', !activeObject.flipX)
      fabricCanvas?.renderAll()
    }
  }

  const flipVertical = () => {
    const activeObject = fabricCanvas?.getActiveObject()
    if (activeObject) {
      activeObject.set('flipY', !activeObject.flipY)
      fabricCanvas?.renderAll()
    }
  }

  const handleSave = async () => {
    if (!fabricCanvas) return

    try {
      const dataURL = fabricCanvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1
      })
      
      const response = await fetch(dataURL)
      const blob = await response.blob()
      
      if (onSave) {
        onSave(blob, { filters: activeFilters })
      } else {
        saveAs(blob, `edited-${photo?.title || 'image'}.png`)
      }
      
      toast.success('Image saved successfully!')
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save image')
    }
  }

  const handleDownload = () => {
    if (!fabricCanvas) return

    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1
    })
    
    const link = document.createElement('a')
    link.download = `edited-${photo?.title || 'image'}.png`
    link.href = dataURL
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Image downloaded!')
  }

  if (!photo) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Edit Photo: {photo.title}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex gap-4">
          {/* Tools Sidebar */}
          <div className="w-80 border-r pr-4 space-y-4 overflow-y-auto">
            <Tabs defaultValue="filters" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="filters">
                  <Sliders className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="tools">
                  <Brush className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="shapes">
                  <Shapes className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="text">
                  <Type className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="filters" className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Presets</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {filterPresets.map((preset) => (
                      <Button
                        key={preset.name}
                        size="sm"
                        variant="outline"
                        onClick={() => handleFilterPreset(preset)}
                        className="text-xs"
                      >
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>Brightness</Label>
                    <Slider
                      value={[activeFilters.brightness * 100]}
                      onValueChange={([value]) => handleFilterChange('brightness', value)}
                      min={-100}
                      max={100}
                      step={1}
                    />
                  </div>
                  
                  <div>
                    <Label>Contrast</Label>
                    <Slider
                      value={[activeFilters.contrast * 100]}
                      onValueChange={([value]) => handleFilterChange('contrast', value)}
                      min={-100}
                      max={100}
                      step={1}
                    />
                  </div>
                  
                  <div>
                    <Label>Saturation</Label>
                    <Slider
                      value={[activeFilters.saturation * 100]}
                      onValueChange={([value]) => handleFilterChange('saturation', value)}
                      min={-100}
                      max={100}
                      step={1}
                    />
                  </div>
                  
                  <div>
                    <Label>Blur</Label>
                    <Slider
                      value={[activeFilters.blur * 10]}
                      onValueChange={([value]) => handleFilterChange('blur', value)}
                      min={0}
                      max={50}
                      step={1}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="tools" className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant={activeTool === 'select' ? 'default' : 'outline'}
                    onClick={() => setActiveTool('select')}
                  >
                    <Move className="h-4 w-4 mr-1" />
                    Select
                  </Button>
                  <Button
                    size="sm"
                    variant={activeTool === 'draw' ? 'default' : 'outline'}
                    onClick={() => setActiveTool('draw')}
                  >
                    <Brush className="h-4 w-4 mr-1" />
                    Draw
                  </Button>
                </div>
                
                {activeTool === 'draw' && (
                  <div className="space-y-3">
                    <div>
                      <Label>Brush Size</Label>
                      <Slider
                        value={[brushSize]}
                        onValueChange={([value]) => setBrushSize(value)}
                        min={1}
                        max={50}
                        step={1}
                      />
                    </div>
                    <div>
                      <Label>Color</Label>
                      <input
                        type="color"
                        value={brushColor}
                        onChange={(e) => setBrushColor(e.target.value)}
                        className="w-full h-10 rounded border"
                      />
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="shapes" className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addShape('rectangle')}
                  >
                    Rectangle
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addShape('circle')}
                  >
                    Circle
                  </Button>
                </div>
                <div>
                  <Label>Fill Color</Label>
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="w-full h-10 rounded border"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="text" className="space-y-4">
                <Button onClick={addText} className="w-full">
                  Add Text
                </Button>
                <div>
                  <Label>Text Color</Label>
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="w-full h-10 rounded border"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-4 border-b">
              <Button size="sm" variant="outline">
                <Undo className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline">
                <Redo className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-border mx-2" />
              <Button size="sm" variant="outline" onClick={rotate}>
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={flipHorizontal}>
                <FlipHorizontal className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={flipVertical}>
                <FlipVertical className="h-4 w-4" />
              </Button>
              <div className="flex-1" />
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>

            {/* Canvas */}
            <div className="flex-1 flex items-center justify-center bg-muted/20 p-4">
              <div className="border border-border rounded-lg shadow-lg overflow-hidden bg-background">
                <canvas ref={canvasRef} />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}