import React from 'react';
import ProceedureWindow from '../modules/ProceedureWindow.jsx';
import piQuery from '../modules/piQuery.js';

class CleanScan extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      title: 'Clean & Scan',
      subtitle: 'Cleaning film library...',
      error: null,
      interval: 1000,
      progress: 0,
      finished: false
    }
  }

  componentDidMount() {
    piQuery('kodi/clean')
    .then(() => { 
      this.setState({
        progress: 30,
        subtitle: 'Scanning for new films...'
      });

      return piQuery('kodi/scan');
    })
    .then(() => {
      this.setState({
        subtitle: 'Cleaning and scanning of film library complete.',
        finished: true
      });
    })
    .catch(error => {
      this.setState({error});
    });
  }

  render() {
    return (
      <ProceedureWindow
        title={this.state.title}
        subtitle={this.state.subtitle}
        error={this.state.error}
        busy={!this.state.finished}
        finished={this.state.finished}
        progress={this.state.progress}
        interval={this.state.interval}
        homeClick={this.props.homeClick}
      />
    );
  }
}

export default CleanScan;