import React from 'react';
import { Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import BaseWindow from './modules/BaseWindow.jsx';
import CleanScan from './procedures/CleanScan.jsx';
import ExportNFO from './procedures/ExportNFO.jsx';
import DeleteViewed from './procedures/DeleteViewed.jsx';
import FilmData from './procedures/FilmData.jsx';
import FileSystem from './procedures/FileSystem.jsx';
import FullMaintain from './procedures/FullMaintain.jsx';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      procedure: null,
    }
    this.menuItems = [
      [FullMaintain, 'Full Maintenance'],
      [FileSystem, 'Subtitles & Filesystem'],
      [ExportNFO, 'Export NFO FIles'],
      [CleanScan, 'Clean & Scan'],
      [DeleteViewed, 'Delete Viewed Films'],
      [FilmData, 'Update Film App'],
    ];
  }

  setProcedure(procedure) {
    this.setState({ procedure })
  }

  render(){
    if (this.state.procedure) return <this.state.procedure homeClick={() => this.setProcedure(null)} />
   
    return (
      <BaseWindow
        title='Pi Manager'
        subtitle='Choose task:'
      >
        <div className="d-grid gap-2">
          {this.menuItems.map((item, index) => {
            return <Button
                    key={index}
                    onClick={() => this.setProcedure(item[0])}
                    variant="outline-secondary"
                    size="lg">
                      {item[1]}
                  </Button>;
          })}
        </div>
      </BaseWindow>
    );
  }  
}

export default App;