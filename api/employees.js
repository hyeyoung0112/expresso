//create and export express app
const express = require('express');
const employeeRouter = express();
module.exports = employeeRouter;

//require sqlite3 and set db
const sqlite = require('sqlite3');
const db = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite');


//middlewares to check validity of requests
/****************************************************************
Check if Employee with given employeeId exists.
If it exists, save employee to req.employee and call next(). Else, send 404(Not Found) error.
****************************************************************/
employeeRouter.param('employeeId', (req, res, next, employeeId) => {
  const sql = `SELECT * FROM Employee WHERE Employee.id = ${employeeId}`;
  db.get(sql, (error, employee) => {
    if (error) {
      throw error;
    } else if (!employee) {
      res.sendStatus(404);
    } else {
      req.employee = employee;
      next();
    }
  });
});

/****************************************************************
Check if given information has all needed information to post / put.
If it does, call next(). Else, send 400(Bad Request) error.
****************************************************************/
const validEmployee = (req, res, next) => {
  const employee = req.body.employee;
  //name, position, wage are required.
  if (!employee.name || !employee.position || !employee.wage) {
    res.sendStatus(400);
  } else {
    next();
  }
}


//GET request to /api/employees
/****************************************************************
Returns a 200 response containing all saved currently-employed employees (on the employees property of the response body
****************************************************************/
employeeRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM Employee WHERE Employee.is_current_employee = 1';
  db.all(sql, (error, employees) => {
    if (error) {
      throw error;
    } else {
      res.status(200).send({employees: employees});
    }
  });
});

//GET request to /api/employees/:employeeId
/****************************************************************
Returns a 200 response containing the employee with the supplied employee ID on the employee property of the response body
If an employee with the supplied employee ID doesn't exist, returns a 404 response
****************************************************************/
employeeRouter.get('/:employeeId', (req, res, next) => {
  res.status(200).send({employee: req.employee});
});

//POST request to /api/employees
/****************************************************************
Creates a new employee with the information from the employee property of the request body and saves it to the database.
Returns a 201 response with the newly-created employee on the employee property of the response body
If any required fields are missing, returns a 400 response
****************************************************************/
employeeRouter.post('/', validEmployee, (req, res, next) => {
  const newEmployee = req.body.employee;  //has needed information to create employee
  const sql = `INSERT INTO Employee (name, position, wage, is_current_employee) VALUES ($name, $position, $wage, $is_current_employee)`;
  const variables = {
    $name: newEmployee.name,
    $position: newEmployee.position,
    $wage: newEmployee.wage,
    $is_current_employee: newEmployee.isCurrentEmployee === 0 ? 0 : 1
  };
  //insert into Employee table
  db.run(sql, variables, function(error) {
    if (error) {
      next(error);
    } else {
      //get newly created employee
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`, (error, employee) => {
        if (error) {
          throw error;
        } else {
          res.status(201).send({employee: employee});
        }
      });
    }
  });
});

//PUT request to /api/employees/:employeeId
/****************************************************************
Updates the employee with the specified employee ID using the information from the request body and saves it to the database.
Returns a 200 response with the updated employee on the employee property of the response body
If any required fields are missing, returns a 400 response
If an employee with the supplied employee ID doesn't exist, returns a 404 response
****************************************************************/
employeeRouter.put('/:employeeId', validEmployee, (req, res, next) => {
  const updateEmployee = req.body.employee; //has information to update
  const sql = `UPDATE Employee SET name = $name, position = $position, wage = $wage, is_current_employee = $isCurrentEmployee WHERE Employee.id = $employeeId`;
  const variables = {
    $name: updateEmployee.name,
    $position: updateEmployee.position,
    $wage: updateEmployee.wage,
    $isCurrentEmployee: updateEmployee.isCurrentEmployee === 0 ? 0 : 1,
    $employeeId: req.employee.id
  };
  //update employee of supplied employeeId with new information
  db.run(sql, variables, function(error) {
    if (error) {
      next(error);
    } else {
      //get updated employee
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.employee.id}`, (error, employee) => {
        if (error) {
          next(error);
        } else {
          res.status(200).send({employee: employee});
        }
      });
    }
  });
});

//DELETE request to /api/employees/employeeId
/****************************************************************
Updates the employee with the specified employee ID to be unemployed (is_current_employee equal to 0).
Returns a 200 response.
If an employee with the supplied employee ID doesn't exist, returns a 404 response
****************************************************************/
employeeRouter.delete('/:employeeId', (req, res, next) => {
  const sql = `UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = ${req.employee.id}`;
  //set employee with supplied employeeId's is_current_employee to 0
  db.run(sql, function(error){
    if (error) {
      next(error);
    } else {
      //get deleted employee
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.employee.id}`, (error, employee) => {
        if (error) {
          throw error;
        } else {
          res.status(200).send({employee: employee});
        }
      });
    }
  });
});


//get Router needed for /api/employees/:employeeId/timesheets
const timesheetRouter = require('./timesheets.js');
employeeRouter.use('/:employeeId/timesheets', timesheetRouter);
