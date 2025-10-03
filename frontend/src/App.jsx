import React from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from './pages/Landing';
import Header from './components/Header';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Landing />} /> 
        <Route path='/' element={<Header />} />          
      </Routes>
    </Router>
  )
}

export default App