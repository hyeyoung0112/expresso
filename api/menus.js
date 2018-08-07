//create and export express app
const express = require('express');
const menuRouter = express();
module.exports = menuRouter;

//require sqlite3 and set db
const sqlite = require('sqlite3');
const db = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite');


//middleware to check validity of requests
/****************************************************************
Check if menu with given menuId exists.
If exists, save menu to req.menu and call next. Else, return 404(Not Found) Error.
****************************************************************/
menuRouter.param('menuId', (req, res, next, menuId) => {
  const sql = `SELECT * FROM Menu WHERE Menu.id = ${menuId}`;
  db.get(sql, (error, menu)=>{
    if (error) {
      next(error);
    } else if (!menu) {
      res.sendStatus(404);
    } else {
      req.menu = menu;
      next();
    }
  });
});

/****************************************************************
Check if given information has all needed information to post / put.
If it does, call next(). Else, send 400(Bad Request) error.
****************************************************************/
const validMenu = (req, res, next) => {
  const newMenu = req.body.menu;
  if (!newMenu.title) {
    res.sendStatus(400);
  } else {
    next();
  }
}


//GET request to /api/menus
/****************************************************************
Returns a 200 response containing all saved menus on the menus property of the response body
****************************************************************/
menuRouter.get('/', (req, res, next) => {
  const sql = `SELECT * FROM Menu`;
  db.all(sql, (error, menus) => {
    if (error) {
      next(error);
    } else {
      res.status(200).send({menus: menus});
    }
  });
});

//GET request to /api/menus/:menuId
/****************************************************************
Returns a 200 response containing the menu with the supplied menu ID on the menu property of the response body
If a menu with the supplied menu ID doesn't exist, returns a 404 response
****************************************************************/
menuRouter.get('/:menuId', (req, res, next) => {
  res.status(200).send({menu: req.menu});
});

//POST request to /api/menus
/****************************************************************
Creates a new menu with the information from the menu property of the request body and saves it to the database.
Returns a 201 response with the newly-created menu on the menu property of the response body
If any required fields are missing, returns a 400 response
****************************************************************/
menuRouter.post('/', validMenu, (req, res, next) => {
  const newMenu = req.body.menu;
  const sql = `INSERT INTO Menu (title) VALUES ($title)`;
  db.run(sql, {$title: newMenu.title}, function(error){
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Menu WHERE Menu.id = ${this.lastID}`, (error, menu)=>{
        res.status(201).send({menu:menu});
      });
    }
  });
});

//PUT request to /api/menus/:menuId
/****************************************************************
Updates the menu with the specified menu ID using the information from the menu property of the request body
and saves it to the database. Returns a 200 response with the updated menu on the menu property of the response body
If any required fields are missing, returns a 400 response
If a menu with the supplied menu ID doesn't exist, returns a 404 response
****************************************************************/
menuRouter.put('/:menuId', validMenu, (req, res, next) => {
  const updateMenu = req.body.menu;
  const sql = `UPDATE Menu SET title = $title WHERE id = $id`;
  const variables = {
    $title: updateMenu.title,
    $id: req.menu.id
  };
  db.run(sql, variables, function(error){
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Menu WHERE id = ${req.menu.id}`, (error, menu)=>{
        res.status(200).send({menu: menu});
      });
    }
  });
});

//DELETE request to /api/menus/:menuId
/****************************************************************
Deletes the menu with the supplied menu ID from the database if that menu has no related menu items. Returns a 204 response.
If the menu with the supplied menu ID has related menu items, returns a 400 response.
If a menu with the supplied menu ID doesn't exist, returns a 404 response
****************************************************************/
menuRouter.delete('/:menuId', (req, res, next) => {
  const itemSql = `SELECT * FROM MenuItem WHERE menu_id = $menuId`;
  const variable = {$menuId: req.menu.id};
  db.get(itemSql, variable, (error, menuItem)=>{
    if (error) {
      next(error);
    } else if (menuItem) {
      res.sendStatus(400);
    } else {
      const delSql = `DELETE FROM Menu WHERE id = $id`;
      db.run(delSql, {$id: req.menu.id}, function(error){
        if (error) {
          next(error);
        } else {
          res.sendStatus(204);
        }
      });
    }
  });
});


//require Router for /api/menus/:menuId/menu-items
const menuItemRouter = require('./menuItems.js');
menuRouter.use('/:menuId/menu-items', menuItemRouter);
