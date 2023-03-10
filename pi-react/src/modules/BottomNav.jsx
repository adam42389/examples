import { Navbar, Container, Button, Spinner} from 'react-bootstrap';

function BottomNav(props) {
  let buttonText;
  if (props.busy && !props.error) buttonText = < Spinner animation="border" size="sm" />;
  else buttonText = props.caption || 'Proceed';

  return (
    <Navbar fixed="bottom" className="bottom-navbar">
      <Container className="justify-content-center mb-2 mt-2">
        <Button 
          variant="outline-secondary" 
          onClick={() => props.homeClick()}
          disabled={props.busy && !props.error}
          className="nav-button mr-5">
            Return Home
        </Button>
        {!props.finished && <Button
          variant="outline-primary" 
          onClick={() => props.nextClick()}
          disabled={props.busy || props.error}
          className="nav-button">
            {buttonText}
        </Button>}
      </Container>
    </Navbar>
  );
}

export default BottomNav;