import React, { useState } from 'react'
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'
import { Header } from '@/components/layout/Header'
import { AuthModal } from '@/components/auth/AuthModal'
import { Gallery } from '@/pages/Gallery'

const AppContent = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onAuthModalOpen={() => setAuthModalOpen(true)} />
      
      <main className="container mx-auto px-4 py-8">
        {user ? (
          <Gallery />
        ) : (
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold mb-4">Welcome to PhotoStudio</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Professional photo editing and gallery management for small businesses
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Smart Gallery</h3>
                <p className="text-muted-foreground">Organize and manage your photos with intelligent categorization</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Advanced Editing</h3>
                <p className="text-muted-foreground">Professional editing tools with filters, effects, and real-time preview</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Batch Processing</h3>
                <p className="text-muted-foreground">Process multiple images at once with consistent settings</p>
              </div>
            </div>
            <button 
              onClick={() => setAuthModalOpen(true)}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Get Started
            </button>
          </div>
        )}
      </main>
      
      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
      />
    </div>
  )
}

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default Index;
