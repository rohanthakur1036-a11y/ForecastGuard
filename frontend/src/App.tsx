import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import RiskExplorer from './pages/RiskExplorer'
import ModelComparison from './pages/ModelComparison'
import Historical from './pages/Historical'
import Validation from './pages/Validation'
import AlertReview from './pages/AlertReview'
import TestModel from './pages/TestModel'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/risk-explorer" element={<RiskExplorer />} />
          <Route path="/model-comparison" element={<ModelComparison />} />
          <Route path="/historical" element={<Historical />} />
          <Route path="/validation" element={<Validation />} />
          <Route path="/alerts" element={<AlertReview />} />
          <Route path="/test-model" element={<TestModel />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
