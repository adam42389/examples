import React from 'react';
import SettingsWindow from '../modules/SettingsWindow.jsx';
import ProceedureWindow from '../modules/ProceedureWindow.jsx';
import Library from '../modules/filesystem/Library.js';
import piQuery from '../modules/piQuery.js';

class FileSystem extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      title: 'Manage Filesystem',
      subtitle: 'Settings:',
      buttonText: 'Analyse',
      showSettings: true,
      finished: false,
      busy: false,
      error: null,
      interval: 800,
      progress: 0,
      listData: [],
    }

    this.nextClick = this.analyse;
    this.updateStatus = this.updateStatus.bind(this);
    this.library = new Library(this.updateStatus);
  }

  updateStatus(status) {
    this.setState({subtitle: status});
  }

  async analyse() {
    this.setState({
      showSettings: false,
      busy: true,
    });

    try {
      await this.library.analyse();
    }
    catch (error) {
      this.setState({error});
      return;
    }

    if (this.library.tasks.length) this.showTasks(); 
    else if (this.library.issues.length) this.showIssues();
    else this.finished();
  }

  showTasks() {
    const variants = {
      rename: 'warning',
      delete: 'danger',
      save: 'info',
      download: 'success',
    };

    const listData = this.library.tasks.map(task => {
      return {
        variant: variants[task.action],
        heading: task.action.toUpperCase(),
        text: task.info,
      }
    });

    this.setState({
      subtitle: 'The following tasks will be performed:',
      buttonText: 'Perform Tasks',
      busy: false,
      listData,
    });

    this.nextClick = this.performTasks;
  }

  async performTasks() {
    this.setState({
      busy: true,
      listData: [],
    });
  
    try {
      await this.library.perform();
      
      if (this.library.needCleanScan) {
        this.setState({ subtitle: 'Cleaning film library...', });
        await piQuery('kodi/clean');
  
        this.setState({ subtitle: 'Scanning for renamed films...' });
        await piQuery('kodi/scan');
      }
    }
    catch (error) {
      this.setState({ error });
      return;
    }

    if (this.library.issues.length) this.showIssues();
    else this.finished();
  }

  showIssues() {
    this.setState({
      subtitle: this.finalSubtitle(),
      busy: false,
      finished: true,
      listData: this.library.issues,
    });
  }

  finished() {
    this.setState({
      subtitle: this.finalSubtitle(),
      finished: true,
    });
  }

  finalSubtitle() {
    let subtitle;
    if (this.library.tasks.length) subtitle = 'All tasks have been performed.';
    else subtitle = 'There are no tasks to perform.';

    if (this.library.issues.length) subtitle += ' Note the following issues:';
    return subtitle;
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
      >
        {this.state.showSettings && <SettingsWindow/>}
      </ProceedureWindow>
    );
  }
}

export default FileSystem;