import {Row, ListGroup} from 'react-bootstrap';

function List(props) {  
  if (!props?.data.length) return null;
  
  const items = props.data.map((item, index) => {
    let text;
    if (typeof item === 'object') {
      text = <Row>
              <div><strong>{item.heading}</strong></div>
              <div>{item.text}</div>
            </Row>
    }
    else text = item;

    return <ListGroup.Item 
                key={index}
                variant={item.variant || ''} 
                className="d-inline-flex align-items-start list-item" 
                as="li"
                action 
    >{text}
            </ListGroup.Item>
  });

  return <ListGroup as="ol">{items}</ListGroup>;
}

export default List;