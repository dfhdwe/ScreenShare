import React from 'react';
import {
  BrowserRouter,
  Route,
  Switch
} from 'react-router-dom';
import HostPage from './routes/Host';
import GuestPage from './routes/Guest';
import './App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Switch>
          <Route path='/host/:roomID' component={GuestPage} />
          <Route path='/host/:roomID' component={HostPage} />
        </Switch>
      </BrowserRouter>
    </div>
  );
}

export default App;
