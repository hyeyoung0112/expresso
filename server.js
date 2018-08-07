//create and export express app
const express = require('express');
const app = express();
module.exports = app;

//require needed custom middlewares
const bodyParser = require('body-parser');
const morgan = require('morgan');

//require needed Routers for employees, timesheet, menu, and menuItem
const employeeRouter = require('./api/employees.js');
const menuRouter = require('./api/menus.js');

//use appopriate middlewares
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(express.static('public'));

//call appopriate routers
app.use('/api/employees', employeeRouter);
app.use('/api/menus', menuRouter);

//app listens to process.env.PORT or either port 4000
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
