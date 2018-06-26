const express = require('express');
const timesheetsRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// Add middleware for handling CORS requests from index.html
const cors = require('cors');
timesheetsRouter.use(cors());

// Add middleware for handling errors
const errorhandler = require('errorhandler');
timesheetsRouter.use(errorhandler());

/**********************validating timesheet if posses all 3 required fields hours, rate, date *****************************/
const isValidTimesheetRequest = (req, res, next) => {
    const timesheetToValidate = req.body.timesheet;

    if (timesheetToValidate.hours && timesheetToValidate.rate && timesheetToValidate.date) {
        next();

    } else {

        return res.status(400).send();
    };
};

/**************************   ROUTE GET /    *****************************/
timesheetsRouter.get('/', (req, res, next) => {
    let responseObject = {};

    db.all("SELECT * FROM Timesheet WHERE employee_id = $employee_id", { $employee_id: req.employee.id }, (err, rows) => {
        responseObject.timesheets = rows;
        res.status(200).send(responseObject);
    } )
});

/**************************   ROUTE POST    *****************************/
timesheetsRouter.post('/', isValidTimesheetRequest, (req, res, next) => {
    const timesheetToCreate = req.body.timesheet;
    let responseObject = {};

    db.run("INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employee_id)", { 
        $hours: timesheetToCreate.hours,
        $rate: timesheetToCreate.rate,
        $date: timesheetToCreate.date,
        $employee_id: req.employee.id
     }, function(err) {
            if (err) {
                console.log(err)
            }
            db.get("SELECT * FROM Timesheet WHERE id = $id", 
            { $id: this.lastID }, (err, row) => {
                if (err) {
                    console.log(err);
                } else {
                    responseObject.timesheet = row;
                    res.status(201).send(responseObject);
                }
            });
    })
});

/*************** validating timesheet if posses valid id  ******************/
const isValidTimesheetId = (req, res, next) => {
    db.get("SELECT * FROM Timesheet WHERE id = $id", { $id: req.params.timesheetId }, (err, row) => {
        if (err) {
            next(err);
        } else if ( !row ) {
            return res.status(404).send();
        } else {
            next();
        }
    });
};

/********** ROUTE PUT /api/employees/:employeeId/timesheets/:timesheetId *********/
timesheetsRouter.put('/:timesheetId', isValidTimesheetId, isValidTimesheetRequest, (req, res, next) => {
    const timesheetID = req.params.timesheetId;
    const timesheetToUpdate = req.body.timesheet;
    let responseObject = {};

    db.run("UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date WHERE id = $id;", {
        $hours: timesheetToUpdate.hours,
        $rate: timesheetToUpdate.rate,
        $date: timesheetToUpdate.date,
        $id: timesheetID
    }, function (err) {
        if (err) {
            console.error(err);
        }
        db.get(`SELECT * FROM Timesheet WHERE id = $id`, { $id: timesheetID }, (err, row) => {
            if (err) {
                console.log(err);
                next(err);
            } else {
                responseObject.timesheet = row;
                return res.status(200).send(responseObject);
            }
        });
    });
});

/**** ROUTE DELETE /api/employees/:employeeId/timesheets/:timesheetId ****/
timesheetsRouter.delete('/:timesheetId', isValidTimesheetId, (req, res, next) => {
    db.run("DELETE FROM Timesheet WHERE id = $id", { $id: req.params.timesheetId }, function(err) {
        if (err) {
            console.log(err);
        } else {
            return res.status(204).send();
        }
    })
});

module.exports = timesheetsRouter;