import React from 'react';
import { ProgressBar } from 'react-bootstrap';

class Progress extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      actual: 0,
    }
    this.timer = null;
    this.interval = 0;
  }

  componentDidMount() {
    this.updateProgress();
  }

  componentDidUpdate() {
    this.updateProgress();
  }

  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer);
  }

  updateProgress() {
    if (this.props?.progress > this.state.actual) {
      this.setState({ actual: this.props.progress });
    }
    
    if (this.state.actual >= 99) {
      if (this.timer) clearInterval(this.timer);
      return;
    }

    if (this.props.interval !== this.interval) {
      this.interval = this.props.interval;
      
      if (this.timer) clearInterval(this.timer);
      if (this.props.interval === 0) return;

      this.timer = setInterval(() => {
        this.setState(state => ({
          actual: Math.min(state.actual + 1, 99)
        }));
      }, this.interval);
    }
  }

  render() {
    return <ProgressBar now={this.state.actual} />;
  }
}

export default Progress;