import { createElement } from 'lwc';
import App from './modules/c/app/app.js';

const app = createElement('c-app', { is: App });
// eslint-disable-next-line @lwc/lwc/no-document-query
document.querySelector('#app').appendChild(app);
