import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar      from './components/Sidebar'
import Paraphraser  from './components/Paraphraser'
import Summarizer   from './components/Summarizer'
import GrammarChecker from './components/GrammarChecker'
import CSRefiner    from './components/CSRefiner'

export default function App() {
  return (
    <BrowserRouter>
      {/* Gradient mesh background */}
      <div className="gradient-mesh" aria-hidden="true" />

      {/* Main layout */}
      <div className="relative z-10 flex h-screen overflow-hidden">
        <Sidebar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/"           element={<Paraphraser />}   />
            <Route path="/summarizer" element={<Summarizer />}    />
            <Route path="/grammar"    element={<GrammarChecker />} />
            <Route path="/cs-refiner" element={<CSRefiner />}     />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
