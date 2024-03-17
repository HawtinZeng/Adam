import logo from './logo.svg';
import './App.css';

const ipcRenderer  = window.ipcRenderer;
const setTranspanrent = () => ipcRenderer.send('set-ignore-mouse-events', true, { forward: true })
const unsetTranspanrent = () => ipcRenderer.send('set-ignore-mouse-events', false)

function App()  {
    return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p onMouseEnter={unsetTranspanrent} onMouseLeave={setTranspanrent}>
          don't clickThrought
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
