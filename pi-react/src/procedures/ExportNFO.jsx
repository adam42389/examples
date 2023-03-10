import React from 'react';
import ProceedureWindow from '../modules/ProceedureWindow.jsx';
import piQuery from '../modules/piQuery.js';

class ExportNFO extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      title: 'Export NFO Files',
      subtitle: 'Exporting NFO files...',
      error: null,
      interval: 5000,
      progress: 0,
      finished: false
    }
  }

  componentDidMount() {
    piQuery('kodi/nfo')
    .then(() => {
      this.setState({
        subtitle: 'NFO Files successfully exported.',
        finished: true
      });
    })
    .catch(error => {
      this.setState({ error });
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

export default ExportNFO;