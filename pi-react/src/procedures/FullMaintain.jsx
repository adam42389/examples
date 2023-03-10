import React from 'react';
import SettingsWindow from '../modules/SettingsWindow.jsx';
import ProceedureWindow from '../modules/ProceedureWindow.jsx';
import Library from '../modules/filesystem/Library.js';
import piQuery from '../modules/piQuery.js';

class FullMaintain extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      title: 'Full Maintenance',
      subtitle: 'Full maintenance can take a while. Each task in the main menu will be performed without prompt.',
      buttonText: 'Begin',
      showSettings: true,
      finished: false,
      busy: false,
      error: null,
      interval: 12000,
      progress: 0,
      listData: [],
    }

    this.issues = [];
    this.updateStatus = this.updateStatus.bind(this);
    this.library = new Library(this.updateStatus);
  }

  updateStatus(status) {
    this.setState({ subtitle: status });
  }

  async process() {
    try {
      this.setState({
        subtitle: 'Cleaning film library...',
        showSettings: false,
        busy: true,
      });
      await piQuery('kodi/clean');

      this.updateStatus('Exporting NFO files...');
      await piQuery('kodi/nfo');

      this.updateStatus('Retrieving list of viewed films...');
      const viewedRes = await piQuery('kodi/viewed');

      if (viewedRes.length) {
        this.updateStatus('Deleting viewed films...');
        const files = viewedRes.map(film => {
          return film.path;
        });
        await piQuery('file/delete', { delete: files });
      }

      await this.library.analyse();
      if (this.library.issues.length) this.issues = this.issues.concat(this.library.issues);
      await this.library.perform();

      this.updateStatus('Cleaning film library...');
      await piQuery('kodi/clean');

      this.updateStatus('Scanning for renamed films...');
      await piQuery('kodi/scan');

      this.updateStatus('Regenerating film app database...');
      const appDataRes = await piQuery('kodi/database');
      if (appDataRes?.issues.length) this.issues = this.issues.concat(appDataRes.issues);

      let subtitle = 'Full maintenance completed successfully.';
      if (this.issues.length) subtitle += ' Note the following issues:';

      this.setState({
        subtitle,
        listData: this.issues,
        busy: !this.issues.length,
        finished: true,
      });
    }
    catch (error) {
      this.setState({ error });
      return;
    }
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
        nextClick={() => this.process()}
      >
        {this.state.showSettings && <SettingsWindow />}
      </ProceedureWindow>
    );
  }
}

export default FullMaintain;