import FormComponent from './components/FormComponent'
import './App.css'

function App() {
  console.log('App component rendering');
  return (
    <div className="App" style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <FormComponent />
    </div>
  )
}

export default App
