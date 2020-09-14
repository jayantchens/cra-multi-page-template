import React from 'react';
import ReactDOM from 'react-dom';

function Index() {
  return (<div style={{ color: 'red' }}>我是index页面</div>)
}


ReactDOM.render(
  <Index />,
  document.getElementById('root')
);
