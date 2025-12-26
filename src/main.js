import { createElement } from 'lwc';
import App from 'c/application';

const app = createElement('c-application', { is: App });
// eslint-disable-next-line @lwc/lwc/no-document-query
document.querySelector('#app').appendChild(app);
