import React from 'react';
import ProceedureWindow from '../modules/ProceedureWindow.jsx';
import piQuery from '../modules/piQuery.js';

class FilmData extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      title: 'Update Film App',
      subtitle: 'Regenerating film app database...',
      error: null,
      interval: 500,
      progress: 0,
      busy: true,
      finished: false,
      listData: [],
    }
  }

  componentDidMount() { 
    piQuery('kodi/database')
    .then(res => {
      const newState = {
        subtitle: 'Film app database successfully regenerated.',
        finished: true,
      };
      
      if (res?.issues.length) {
        newState.busy = false;
        newState.subtitle += '  Note the following issues:';
        newState.listData = res.issues;
      }
      
      this.setState(newState);
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
        busy={this.state.busy}
        finished={this.state.finished}
        progress={this.state.progress}
        interval={this.state.interval}
        listData={this.state.listData}
        homeClick={this.props.homeClick}
      />
    );
  }
}

export default FilmData;