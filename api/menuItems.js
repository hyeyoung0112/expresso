//create and export express app
const express = require('express');
const menuItemRouter = express();
module.exports = menuItemRouter;

//require sqlite3 and set db
const sqlite = require('sqlite3');
const db = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite');


//middleware to check validity of requests
/****************************************************************
Check if menuItem with given menuItemId exists.
If exists, save menuItem to req.menuItem and call next. Else, return 404(Not Found) Error.
****************************************************************/
menuItemRouter.param('menuItemId', (req, res, next, menuItemId) => {
  const sql = `SELECT * FROM MenuItem WHERE MenuItem.id = ${menuItemId}`;
  db.get(sql, (error, menuitem) => {
    if (error) {
      next(error);
    } else if (!menuitem) {
      res.sendStatus(404);
    } else {
      req.menuItem = menuitem;
      next();
    }
  });
});

/****************************************************************
Check if given information has all needed information to post / put.
If it does, call next(). Else, send 400(Bad Request) error.
****************************************************************/
const validMenuItem = (req, res, next) => {
  const menuItem = req.body.menuItem;
  if (!menuItem.name || !menuItem.inventory || !menuItem.inventory || !menuItem.price) {
    res.sendStatus(400);
  } else {
    next();
  }
}


//GET request to /api/menus/:menuId/menu-items
/****************************************************************
Returns a 200 response containing all saved menu items related to the menu with the supplied menu ID on the menuItems property of the response body
If a menu with the supplied menu ID doesn't exist, returns a 404 response.
****************************************************************/
menuItemRouter.get('/', (req, res, next) => {
  const sql = `SELECT * FROM MenuItem WHERE MenuItem.menu_id = ${req.menu.id}`;
  db.all(sql, (error, menuitems) => {
    if (error) {
      next(error);
    } else {
      res.status(200).send({menuItems: menuitems});
    }
  });
});

//POST request to /api/menus/:menuId/menu-items
/****************************************************************
Creates a new menu item, related to the menu with the supplied menu ID, with the information from the request body and saves it to the database.
Returns a 201 response with the newly-created menu item on the menuItem property of the response body
If any required fields are missing, returns a 400 response
If a menu with the supplied menu ID doesn't exist, returns a 404 response
****************************************************************/
menuItemRouter.post('/', validMenuItem, (req, res, next) => {
  const newMenuItem = req.body.menuItem;
  const sql = `INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menu_id)`;
  const variables = {
    $name: newMenuItem.name,
    $description: newMenuItem.description,
    $inventory: newMenuItem.inventory,
    $price: newMenuItem.price,
    $menu_id: req.menu.id
  };
  db.run(sql, variables, function(error){
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${this.lastID}`, (error, menuitem) => {
        if (error) {
          next(error);
        } else {
          res.status(201).send({menuItem: menuitem});
        }
      });
    }
  });
});

//PUT request to /api/menus/:menuId/menu-items/menuItemId
/****************************************************************
Updates the menu item with the specified menu item ID using the information from the request body and saves it to the database.
Returns a 200 response with the updated menu item on the menuItem property of the response body
If any required fields are missing, returns a 400 response
If a menu with the supplied menu ID doesn't exist, returns a 404 response
If a menu item with the supplied menu item ID doesn't exist, returns a 404 response
****************************************************************/
menuItemRouter.put('/:menuItemId', validMenuItem, (req, res, next) => {
  const newMenuItem = req.body.menuItem;
  const sql = `UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price WHERE id = $menuItemId`;
  const variables = {
    $name: newMenuItem.name,
    $description: newMenuItem.description,
    $inventory: newMenuItem.inventory,
    $price: newMenuItem.price,
    $menuItemId: req.menuItem.id
  };
  db.run(sql, variables, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${req.menuItem.id}`, (error, menuitem)=>{
        if (error) {
          next(error);
        } else {
          res.status(200).send({menuItem: menuitem});
        }
      });
    }
  });
});

//DELETE request to /api/menus/:menuId/menu-items/menuItemId
/****************************************************************
Deletes the menu item with the supplied menu item ID from the database. Returns a 204 response.
If a menu with the supplied menu ID doesn't exist, returns a 404 response
If a menu item with the supplied menu item ID doesn't exist, returns a 404 response
****************************************************************/
menuItemRouter.delete('/:menuItemId', (req, res, next) => {
  const sql = `DELETE FROM MenuItem WHERE MenuItem.id = ${req.menuItem.id}`;
  db.run(sql, function(error){
    if (error) {
      next(error);
    } else {
      res.sendStatus(204);
    }
  });
});
