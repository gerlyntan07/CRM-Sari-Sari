import React from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from './pages/Landing';
import Header from './components/Header';
import Signup from './pages/Signup';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Landing />} /> 
        <Route path='/' element={<Header />} />    
        <Route path='/Signup' element={<Signup />} />      
      </Routes>
    </Router>
  )
} 

export default App