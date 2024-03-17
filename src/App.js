import logo from './logo.svg';
import { useRef } from 'react';
import './App.css';
import { ipcRenderer } from 'electron';

const setTranspanrent = () => 
ipcRenderer.send('set-ignore-mouse-events', true, { forward: true })
// const unsetTranspanrent = () => 
//   ipcRenderer.send('set-ignore-mouse-events', false)
  
function App()  {

  const clickThroughRef = useRef(null);
  // clickThroughRef.current.addEventListener('mouseenter', unsetTranspanrent)
  clickThroughRef.current.addEventListener('mouseleave', setTranspanrent)
  
    return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p ref={clickThroughRef}>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
