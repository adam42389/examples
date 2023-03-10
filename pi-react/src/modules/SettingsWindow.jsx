import React from 'react';
import { Form } from 'react-bootstrap';
import piQuery from './piQuery.js';
import languages from './languages.json';

const defaultLang = ['English', 'eng', 'en'];

class SettingsWindow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      libraryPath: 'Loading...',
      langIndex: null,
    };

    this.setLanguage = this.setLanguage.bind(this);

    const langTally = [];

    this.langList = languages.flatMap(codes => {
      if (langTally.includes(codes[0])) return [];
      langTally.push(codes[0]);
      return [codes];
    });

    let langJSON = localStorage.getItem('language');
    
    if (!langJSON) {
      langJSON = JSON.stringify(defaultLang);
      localStorage.setItem('language', langJSON);
    }

    for (const index in this.langList) {
      if (langJSON === JSON.stringify(this.langList[index])) {
        this.state.langIndex = parseInt(index);
        break;
      }
    }
  }

  componentDidMount() {
    piQuery('file/path')
    .then(res => {
      this.setState({libraryPath: res.path});
    })
    .catch(error => {
      this.setState({error});
    });
  }

  setLanguage(event) {
    const langIndex = parseInt(event.target.value);
    const langJSON = JSON.stringify(this.langList[langIndex]);
    localStorage.setItem('language', langJSON);
    this.setState({langIndex});
  }

  render() {

    const langOptions = this.langList.map((codes, index) => {
      return [<option key={index} value={index}>{codes[0]}</option>];
    })

    return (
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Film Library Path</Form.Label>
          <Form.Control
            disabled
            type="text"
            value={this.state.libraryPath}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Subtitle Language</Form.Label>
          <Form.Select
            className="sub-select"
            value={this.state.langIndex}
            onChange={this.setLanguage}
          >
            {langOptions}
          </Form.Select>
        </Form.Group>
    </Form>
    );
  }
}

export default SettingsWindow;