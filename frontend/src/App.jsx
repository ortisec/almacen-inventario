import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Movements from './pages/Movements'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route index element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/movements" element={<Movements />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App