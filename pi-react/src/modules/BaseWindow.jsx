import { Container } from 'react-bootstrap';

function BaseWindow(props) {
  return (
    <Container className="mt-4 mb-5 pb-5">
      <h3>{props.title}</h3>
      <h6 className="mb-3 mt-4">{props.subtitle}</h6>
      {props.children}
    </Container>
  );
}

export default BaseWindow;