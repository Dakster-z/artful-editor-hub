import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Edit, Trash2, Download, Search, Filter, MoreVertical } from 'lucide-react'
import { Photo } from '@/types'
import { supabase, deleteImage } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthProvider'
import { toast } from 'sonner'

interface PhotoGridProps {
  photos: Photo[]
  onPhotosChange: (photos: Photo[]) => void
  onEditPhoto: (photo: Photo) => void
  selectedPhotos: string[]
  onSelectionChange: (photoIds: string[]) => void
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  onPhotosChange,
  onEditPhoto,
  selectedPhotos,
  onSelectionChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>(photos)
  const { user } = useAuth()

  useEffect(() => {
    const filtered = photos.filter(photo =>
      photo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (photo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    )
    setFilteredPhotos(filtered)
  }, [photos, searchTerm])

  const handleDelete = async (photo: Photo) => {
    if (!user) return
    
    try {
      // Delete from storage
      await deleteImage(photo.file_path)
      
      // Delete from database
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photo.id)
      
      if (error) throw error
      
      const updatedPhotos = photos.filter(p => p.id !== photo.id)
      onPhotosChange(updatedPhotos)
      toast.success('Photo deleted successfully')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete photo')
    }
  }

  const handleDownload = (photo: Photo) => {
    const link = document.createElement('a')
    link.href = photo.file_url
    link.download = photo.title
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const toggleSelection = (photoId: string) => {
    const newSelection = selectedPhotos.includes(photoId)
      ? selectedPhotos.filter(id => id !== photoId)
      : [...selectedPhotos, photoId]
    onSelectionChange(newSelection)
  }

  const selectAll = () => {
    onSelectionChange(filteredPhotos.map(photo => photo.id))
  }

  const clearSelection = () => {
    onSelectionChange([])
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search photos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          {selectedPhotos.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {selectedPhotos.length} selected
              </Badge>
              <Button size="sm" variant="outline" onClick={clearSelection}>
                Clear
              </Button>
            </div>
          )}
          <Button size="sm" variant="outline" onClick={selectAll}>
            Select All
          </Button>
        </div>
      </div>

      {/* Photo Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm ? 'No photos match your search.' : 'No photos uploaded yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                selectedPhotos.includes(photo.id)
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-transparent hover:border-primary/50'
              }`}
              onClick={() => toggleSelection(photo.id)}
            >
              <img
                src={photo.file_url}
                alt={photo.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              
              {/* Selection indicator */}
              {selectedPhotos.includes(photo.id) && (
                <div className="absolute top-2 left-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full" />
                </div>
              )}
              
              {/* Actions */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      onEditPhoto(photo)
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      handleDownload(photo)
                    }}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(photo)
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Photo info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-sm font-medium truncate">{photo.title}</p>
                <p className="text-white/80 text-xs">
                  {new Date(photo.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}