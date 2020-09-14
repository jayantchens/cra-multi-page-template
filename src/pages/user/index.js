import React from 'react';
import ReactDOM from 'react-dom';

function Index() {
  return (<div style={{ color: 'skyblue' }}>我是user页面</div>)
}


ReactDOM.render(
  <Index />,
  document.getElementById('root')
);
