const express = require('express');
const menusRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// handle :menuId parameters

menusRouter.param('menuId', (req, res, next, id) => {
    db.get(`SELECT * FROM Menu WHERE id = $id`, {$id: id}, (err, menu) => {
      if (err) {
        next(err);

      } else if (menu) {
        req.menu = menu;
        next();

      } else {
        res.sendStatus(404);
      }
    });
});

// handle :menuItemId parameters
menusRouter.param('menuItemId', (req, res, next, id) => {
    db.get(`SELECT * FROM MenuItem WHERE id = $id`, {$id: id}, (err, menuItem) => {
      if (err) {
        next(err);

      } else if (menuItem) {
        req.menuItem = menuItem;
        next();

      } else {
        res.sendStatus(404);
      }
    });
});

/**************************   ROUTE GET /    *****************************/
menusRouter.get('/', (req, res, next) => {
let responseObject = {};
    db.all('SELECT * FROM Menu', (err,rows) => {
        responseObject.menus = rows;
        if (err) {
            console.log(err);
        }
        res.status(200).send(responseObject);
    })
});


/************* validating menu if posses title field  *******************/
const isValidMenuRequest = (req, res, next) => {
    const menuToValidate = req.body.menu;

    if (menuToValidate.title) {
        next();

    } else {

        return res.status(400).send();
    };
};

/**************************   ROUTE POST /    *****************************/
menusRouter.post('/', isValidMenuRequest, (req, res, next) => {
    let responseObject = {};
    const menuToCreate = req.body.menu;
    db.run("INSERT INTO Menu (title) VALUES ($title)", { 
        $title: menuToCreate.title
     }, function(err) {
            if (err) {
                console.log(err)
            }
            db.get("SELECT * FROM Menu WHERE id = $id", 
            { $id: this.lastID }, (err, row) => {
                if (err) {
                    console.log(err);
                } else {
                    responseObject.menu = row;
                    res.status(201).send(responseObject);
                }
            });
    })
});

/**************************    ROUTE GET ID /:menuId    *****************************/
menusRouter.get('/:menuId', (req, res, next) => {
    const responseObject = {
        menu: req.menu
    };
    res.status(200).send(responseObject);
});

/**************************    ROUTE PUT ID /:menuId    *****************************/
menusRouter.put('/:menuId', isValidMenuRequest, (req, res, next) => {
    const menuToUpdate = req.body.menu;
    let responseObject = {};
    
    db.run("UPDATE Menu SET title = $title WHERE id = $id;", {
        $title: menuToUpdate.title,
        $id: req.menu.id
    }, function (err) {
        if (err) {
            console.error(err);
        }
        db.get(`SELECT * FROM Menu WHERE id = $id`, { $id: req.menu.id }, (err, row) => {
            if (err) {
                console.log(err);
                next(err);
            } else {
                responseObject.menu = row;
                return res.status(200).send(responseObject);
            }
        });
    }); 
});

/****************** Checking wheter supplied menu has related menu items ***************************/
const menuItemsChecker = (req, res, next) => {

    db.get("SELECT * FROM MenuItem WHERE menu_id = $id", { 
        $id: req.menu.id 
    }, (err, row) => {
        if (err) {
           console.log(err);
           next(err);
        } else if (row) {
            return res.status(400).send();
        } else { 
            next();
        }
    });    
};

/************************ ROUTE DELETE *******************************/
menusRouter.delete('/:menuId', menuItemsChecker, (req, res, next) => {
    db.run("DELETE FROM Menu WHERE id = $id", { $id: req.menu.id }, function(err) {
        if (err) {
            console.log(err);
        } else {
            return res.status(204).send();
        }
    })
});

/*******************    ROUTE GET /:menuId/menu-items/    *************************/
menusRouter.get('/:menuId/menu-items/', (req, res, next) => {
    
    let responseObject = {};
    const sqlQuery = "SELECT * FROM MenuItem WHERE menu_id = $id";
    
    db.all(sqlQuery, {
        $id: req.menu.id
    }, (err, rows) => {
        responseObject.menuItems = rows;
        if (err) {
            console.log(err);
            next(err);
        } else if (rows) {
            return res.status(200).send(responseObject);
        }
    });
});

/************* validating menuItem if posses all required fields  *******************/
const isValidMenuItemRequest = (req, res, next) => {
    const menuItemToValidate = req.body.menuItem;

    if (menuItemToValidate.name && menuItemToValidate.description && menuItemToValidate.inventory && menuItemToValidate.price) {
        next();

    } else {

        return res.status(400).send();
    };
};

/*******************    ROUTE POST /:menuId/menu-items/    *************************/
menusRouter.post('/:menuId/menu-items/', isValidMenuItemRequest, (req, res, next) => {
    let responseObject = {};
    const menuItemToCreate = req.body.menuItem;
    
    db.run("INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menu_id)", { 
        $name: menuItemToCreate.name,
        $description: menuItemToCreate.description,
        $inventory: menuItemToCreate.inventory,
        $price: menuItemToCreate.price,
        $menu_id: req.menu.id
     }, function(err) {
            if (err) {
                console.log(err)
            }
            db.get("SELECT * FROM MenuItem WHERE id = $id", 
            { $id: this.lastID }, (err, row) => {
                if (err) {
                    console.log(err);
                } else {
                    responseObject.menuItem = row;
                    res.status(201).send(responseObject);
                }
            });
    })
});

/**************************    ROUTE PUT ID /:menuId/menu-items/:menuItemId    *****************************/
menusRouter.put('/:menuId/menu-items/:menuItemId', isValidMenuItemRequest, (req, res, next) => {
    const menuItemToUpdate = req.body.menuItem;
    let responseObject = {};
    
    db.run("UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price, menu_id = $menu_id WHERE id = $id;", {
        $id: req.menuItem.id,
        $name: menuItemToUpdate.name,
        $description: menuItemToUpdate.description,
        $inventory: menuItemToUpdate.inventory,
        $price: menuItemToUpdate.price,
        $menu_id: req.menu.id
    }, function (err) {
        if (err) {
            console.error(err);
        }
        db.get(`SELECT * FROM MenuItem WHERE id = $id`, { $id: req.menuItem.id }, (err, row) => {
            if (err) {
                console.log(err);
                next(err);
            } else {
                responseObject.menuItem = row;
                return res.status(200).send(responseObject);
            }
        });
    }); 
});

/************************ ROUTE DELETE *******************************/
menusRouter.delete('/:menuId/menu-items/:menuItemId', (req, res, next) => {
    db.run("DELETE FROM MenuItem WHERE id = $id", { $id: req.menuItem.id }, function(err) {
        if (err) {
            console.log(err);
        } else {
            return res.status(204).send();
        }
    })
});



module.exports = menusRouter;