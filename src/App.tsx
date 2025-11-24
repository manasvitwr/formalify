import React, { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FormalifyCard } from './features/formalify/components/FormalifyCard'
import { Footer } from './components/layout/Footer'
import { Toaster } from 'sonner'
import { useFormalityStore } from './features/formalify/store/formalify.store'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function AppContent() {
  const { isAddLabelModalOpen, isToneInfoModalOpen } = useFormalityStore()

  // Fix modal overflow by preventing body scroll when modals are open
  useEffect(() => {
    if (isAddLabelModalOpen || isToneInfoModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = ''
    }
  }, [isAddLabelModalOpen, isToneInfoModalOpen])

  return (
    <>
      {/* Full-screen container with animated radial gradient background */}
      <div className="relative min-h-screen w-full overflow-hidden animated-gradient">
        {/* Main content container */}
        <div className="relative z-10 min-h-screen pb-20 flex flex-col items-center justify-center px-4 py-8 md:py-12 lg:py-16">
          <div className="w-full max-w-[340px] md:max-w-[500px] lg:max-w-[600px] xl:max-w-[700px] mx-auto">
            <FormalifyCard />
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>

      <Toaster position="top-center" richColors theme="dark" />
    </>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}
