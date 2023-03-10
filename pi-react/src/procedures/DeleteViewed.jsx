import React from 'react';
import ProceedureWindow from '../modules/ProceedureWindow.jsx';
import piQuery from '../modules/piQuery.js';

class DeleteViewed extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      title: 'Delete Viewed Films',
      subtitle: 'Retrieving list of viewed films...',
      error: null,
      interval: 300,
      progress: 0,
      busy: true,
      finished: false,
      listData: [],
      buttonText: null,
    }

    this.fileData = null;
    this.nextClick = null;
  }

  componentDidMount() {
    piQuery('kodi/viewed')
    .then(res => {
      if (!res.length) {
        this.setState({
          subtitle: 'There are no viewed films to delete',
          finished: true,
        });
        return;
      }
      this.fileData = res;
      this.showList();
    })
    .catch(error => {
      this.setState({ error });
    });
  }

  showList() {
    const listData = this.fileData.map(film => {
      return film.title;
    });
    
    this.setState({
      subtitle: 'The following films will be deleted:',
      busy: false,
      listData,
      buttonText: 'Delete Films'
    });

    this.nextClick = this.doDelete;
  }

  doDelete() {
    this.setState({
      subtitle: 'Deleting viewed films...',
      listData: null,
      busy: true,
      progress: 30,
    });

    const files = this.fileData.map(film => {
      return film.path;
    });

    piQuery('file/delete', { delete: files})
    .then(() => {
      this.setState({
        progress: 50,
        subtitle: 'Cleaning film library...'
      });

      return piQuery('kodi/clean');
    })
    .then(() => {
      this.setState({
        subtitle: 'Viewed films have been successfully deleted.',
        finished: true,
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
        busy={this.state.busy}
        finished={this.state.finished}
        progress={this.state.progress}
        interval={this.state.interval}
        listData={this.state.listData}
        buttonText={this.state.buttonText}
        homeClick={this.props.homeClick}
        nextClick={() => this.nextClick()}
      />
    );
  }
}

export default DeleteViewed;