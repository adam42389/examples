/* 
Paramter Validator
------------------

'+' signifies
-------------
  str:            length > 0
  int:            > 0
  flt:            > 0
  arr:            length > 0
  obj:            keys.length > 0
  bool:           true

  
Object
------
params = {                    
  username:       'john4',                    
  password:       '324ou32oi4u23',                    
  hint:           '',                   
  age:            40,                   
  interests:      ['coding', 'hacking', 'darts'],                   
  thoughts:       {happy: 'sad', high: 'low'},                    
  person:         true,                   
  temperature:    31.4,                   
};                    

schema = {
  username:       'str+',
  password:       'str+',
  hint:           'str',
  age:            'int+',
  interests:      'arr',
  thoughts:       'obj+',
  person:         'bool',
  temperature:    'flt',
};


Array
-----
params = ['coding', 'hacking', 'darts'];
schema = ['str+'];


Single
------
params = 'John';
schema = 'str+';

*/

function validate(params, schema) {  
  const err = new Error('Invalid parameters.');
  if (!schema) throw err;

  if (typeof schema === 'object') {
    if (typeof params !== 'object') throw err;

    if (Array.isArray(schema)) {
      if (!Array.isArray(params) || schema.length !== 1) throw err;
      for (const param of params) if (!testParam(param, schema[0])) throw err;
    }
    else {
      if (Array.isArray(params)) throw err;
      for (const schemaKey in schema) if (!testParam(params[schemaKey], schema[schemaKey])) throw err;
    }
  }
  else testParam(params, schema);
  
  return true;

  function testParam(param, scheme){
    if (typeof scheme !== 'string' || scheme.length < 3) throw err;
    const plus = scheme.slice(-1) === '+';
    if (plus) scheme = scheme.slice(0, -1);

    switch (scheme) {
      case 'str':
        if (typeof param !== 'string' || (plus && !param.length)) throw err;
        break;

      case 'int':
        if (!Number.isInteger(param) || (plus && param <= 0)) throw err;
        break;

      case 'flt':
        if (!typeof param === 'number' || (plus && param <= 0)) throw err;
        break;

      case 'arr':
        if (!Array.isArray(param) || (plus && !param.length)) throw err;
        break;

      case 'obj':
        if (!typeof param === 'object' || Array.isArray(param) || (plus && !Object.keys(param).length)) throw err;
        break;

      case 'bool':
        if (!typeof param === 'boolean' || (plus && !param)) throw err;
        break;
      
      default :
        throw err;
    }
    return true;
  } 
}

module.exports = validate;