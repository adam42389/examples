import React from 'react';
import { Alert } from 'react-bootstrap';
import BaseWindow from './BaseWindow.jsx';
import BottomNav from './BottomNav.jsx';
import Progress from './Progress.jsx';
import List from './List.jsx';

class ProceedureWindow extends React.Component {
  constructor(props) {
    super(props);
    this.wakeLock = null;
  }
  
  componentDidMount() {
    if (this.props.busy) this.requestWakeLock();
  }

  componentDidUpdate() {
    if (this.wakeLock) {
      if (!this.props.busy || this.props.finished || this.props.error) this.releaseWakeLock();
    }
    else {
      if (this.props.busy && !this.props.finished && !this.props.error) this.requestWakeLock();
    }
  }

  componentWillUnmount() {
    if (this.wakeLock) this.releaseWakeLock();
  }
 
  async requestWakeLock() {
    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
    } catch {}
  };
 
  async releaseWakeLock() {
    if (!this.wakeLock) return;
    try {
      await this.wakeLock.release();
      this.wakeLock = null;
    } catch {}
  };

  render() {
    if (this.props.error) console.error(this.props.error);

    return (
      <BaseWindow
        title={this.props.title}
        subtitle={this.props.subtitle}
      >
        {this.props.error && 
          <Alert className="mt-4" variant='danger'>
            <strong>{this.props.error.name}:</strong> {this.props.error.message}
          </Alert>
        }
        {this.props.busy &&
          <Progress
            progress={this.props.finished ? 100 : this.props.progress}
            interval={this.props.error ? 0 : this.props.interval}
          />
        }
        {this.props.listData &&
          <List data={this.props.listData} />
        }
        {this.props.children}
        <BottomNav
          homeClick={() => this.props.homeClick()}
          nextClick={() => this.props.nextClick()}
          error={this.props.error}
          busy={this.props.busy && !this.props.finished}
          finished={this.props.finished}
          caption={this.props.buttonText}
        />
      </BaseWindow>
    );
  }
}

export default ProceedureWindow;