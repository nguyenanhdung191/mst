/*
global chrome
*/

import React from 'react';
import ReactDOM from 'react-dom';
import App from "./App";


var style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = chrome.extension.getURL('index.css');
(document.head || document.documentElement).appendChild(style);



let div = document.createElement("div");
div.id = "root";
document.getElementsByTagName("body")[0].appendChild(div);
ReactDOM.render(<App />, document.getElementById('root'));

