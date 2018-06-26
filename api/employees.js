const express = require('express');
const employeesRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// Mount existing timesheetsRouter below at the '/:employeeId/timesheets' path.
const timesheetsRouter = require('./timesheets.js');
employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

/**************** .param()  employeeId *****************/
const sqlQuery = `SELECT * FROM Employee WHERE id = $id`;

// handle :employeeId parameters
employeesRouter.param('employeeId', (req, res, next, id) => {
    db.get(sqlQuery, {$id: id}, (err, employee) => {
      if (err) {
        next(err);

      } else if (employee) {
        req.employee = employee;
        next();

      } else {
        res.sendStatus(404);
      }
    });
});


/**************************   ROUTE GET /    *****************************/
employeesRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Employee WHERE is_current_employee = 1;', (err,rows) => {
        res.status(200).send({employees: rows});
    })
});

/**********************validating employee if posses all 3 required fields name, pos, wage*****************************/
const isValidEmployeeRequest = (req, res, next) => {
    const employeeToValidate = req.body.employee;

    if (employeeToValidate.name && employeeToValidate.position && employeeToValidate.wage) {
        next();

    } else {

        return res.status(400).send();
    };
};

/**************************    ROUTE POST  /    *****************************/
employeesRouter.post('/', isValidEmployeeRequest, (req, res, next) => {
    const employeeToCreate = req.body.employee;

    let responseObject = {}; 

    db.run('INSERT INTO Employee (name, position, wage, is_current_employee ) VALUES ($name, $position, $wage, $is_current_employee )', {
            $name: employeeToCreate.name,
            $position: employeeToCreate.position,
            $wage: employeeToCreate.wage,
            $is_current_employee: 1
        }, function (err) {
            if (err) { 
                return console.log(err);
            }

            db.get(`SELECT * FROM Employee WHERE id = $id`, { $id: this.lastID }, (err, row) => {
                if (err) {
                    console.log(err);
                    next(err);
                } else {
                    responseObject.employee = row;
                    return res.status(201).send(responseObject);
                }
            });
        }
    );
});

/**************************    ROUTE GET ID /:employeeId    *****************************/
employeesRouter.get('/:employeeId', (req, res, next) => {
    const responseObject = {
        employee: req.employee
    };
    res.status(200).send(responseObject);
});

/**************************    ROUTE PUT ID /:employeeId    *****************************/
employeesRouter.put('/:employeeId', isValidEmployeeRequest, (req, res, next) => {
    const employeeToUpdate = req.body.employee;
    let responseObject = {};
    
    db.run("UPDATE Employee SET name = $name, position = $position, wage = $wage WHERE id = $id;", {
        $name: employeeToUpdate.name,
        $position: employeeToUpdate.position,
        $wage: employeeToUpdate.wage,
        $id: req.employee.id
    }, function (err) {
        if (err) {
            console.error(err);
        }
        db.get(`SELECT * FROM Employee WHERE id = $id`, { $id: req.employee.id }, (err, row) => {
            if (err) {
                console.log(err);
                next(err);
            } else {
                responseObject.employee = row;
                return res.status(200).send(responseObject);
            }
        });
    });
});

/**************************    ROUTE DELETE ID /:employeeId    *****************************/
employeesRouter.delete('/:employeeId', (req, res, next) => {
    let responseObject = {};

    db.run("UPDATE Employee SET is_current_employee = 0 WHERE id = $id;", {$id: req.employee.id}, function(err) {
        if (err) {
            console.log(err);
        }
        db.get("SELECT * FROM Employee WHERE id = $id", { $id: req.employee.id}, (err, row) => {
            if (err) {
                console.log(err);
                next(err);
            } else {
                responseObject.employee = row;
                return res.status(200).send(responseObject);
            }
        })
    })
});

module.exports = employeesRouter;