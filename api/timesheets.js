//create and export express app
const express = require('express');
const timesheetRouter = express();
module.exports = timesheetRouter;

//require sqlite3 and set db
const sqlite = require('sqlite3');
const db = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite');


//middlewares to check validity of requests
/****************************************************************
Check if timesheet with given timesheetId exists.
If it exists, save the timesheet to req.timesheet and call next(). Else, return 404(Not Found) error.
****************************************************************/
timesheetRouter.param('timesheetId', (req, res, next, timesheetId) => {
  const sql = `SELECT * FROM Timesheet WHERE Timesheet.id = ${timesheetId}`;
  db.get(sql, (error, timesheet) => {
    if (error) {
      throw error;
    } else if (!timesheet) {
      res.sendStatus(404);
    } else {
      req.timesheet = timesheet;
      next();
    }
  });
});

/****************************************************************
Check if given information has all needed information to post / put.
If it does, call next(). Else, send 400(Bad Request) error.
****************************************************************/
const validTimesheet = (req, res, next) => {
  const timesheet = req.body.timesheet;
  if (!timesheet.hours || !timesheet.rate || !timesheet.date) {
    res.sendStatus(400);
  } else{
    next();
  }
}


//GET request to employees/:employeeId/timesheets
/****************************************************************
Returns a 200 response containing all saved timesheets related to the employee
with the supplied employee ID on the timesheets property of the response body
If an employee with the supplied employee ID doesn't exist, returns a 404 response
****************************************************************/
timesheetRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM Timesheet WHERE Timesheet.employee_id = ${req.employee.id}`, (error, timesheets) => {
    if (error) {
      next(error);
    } else {
      res.status(200).send({timesheets: timesheets});
    }
  });
});

//POST request to employees/:employeeId/timesheets
/****************************************************************
Creates a new timesheet, related to the employee with the supplied employee ID,
with the information from the timesheet property of the request body and saves it to the database.
Returns a 201 response with the newly-created timesheet on the timesheet property of the response body
If an employee with the supplied employee ID doesn't exist, returns a 404 response
****************************************************************/
timesheetRouter.post('/', validTimesheet, (req, res, next) => {
  const newTimesheet = req.body.timesheet;
  const sql = `INSERT Into Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employeeID);`;
  const variables = {
    $hours: newTimesheet.hours,
    $rate: newTimesheet.rate,
    $date: newTimesheet.date,
    $employeeID: req.employee.id
  };
  db.run(sql, variables, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`, (error, timesheet)=>{
        if (error) {
          next(error);
        } else {
          res.status(201).send({timesheet: timesheet});
        }
      });
    }
  });
});

//PUT request to employees/:employeeId/timesheets/:timesheetId
/****************************************************************
Updates the timesheet with the specified timesheet ID using the information from the request body
and saves it to the database. Returns a 200 response with the updated timesheet on the timesheet property of the response body
If any required fields are missing, returns a 400 response
If an employee with the supplied employee ID doesn't exist, returns a 404 response
If an timesheet with the supplied timesheet ID doesn't exist, returns a 404 response
****************************************************************/
timesheetRouter.put('/:timesheetId', validTimesheet, (req, res, next) => {
  const newTimesheet = req.body.timesheet;
  const sql = `UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date, employee_id = $employeeID WHERE timesheet.id = $timesheetId`;
  const variables = {
    $hours: newTimesheet.hours,
    $rate: newTimesheet.rate,
    $date: newTimesheet.date,
    $employeeID: req.employee.id,
    $timesheetId: req.timesheet.id
  };
  db.run(sql, variables, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${req.timesheet.id}`, (error, timesheet)=>{
        if (error) {
          next(error);
        } else {
          res.status(200).send({timesheet: timesheet});
        }
      });
    }
  });
});

//DELETE request to employees/:employeeId/timesheets/:timesheetId
/****************************************************************
Deletes the timesheet with the supplied timesheet ID from the database. Returns a 204 response.
If an employee with the supplied employee ID doesn't exist, returns a 404 response
If an timesheet with the supplied timesheet ID doesn't exist, returns a 404 response
****************************************************************/
timesheetRouter.delete('/:timesheetId', (req, res, next) => {
  const sql = `DELETE FROM Timesheet WHERE Timesheet.id = ${req.timesheet.id}`;
  db.run(sql, function(error){
    if (error) {
      next(error);
    } else {
      res.sendStatus(204);
    }
  });
});
