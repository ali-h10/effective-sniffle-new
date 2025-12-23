const db = require('../../connectors/db');
const { getSessionToken , getUser } = require('../../utils/session');
const axios = require('axios');
require('dotenv').config();
const {authMiddleware} = require('../../middleware/auth');
const PORT = process.env.PORT || 3001;

function handlePrivateFrontEndView(app) {

    app.get('/testingAxios' , async (req , res) => {

        try {
            const result = await axios.get(`http://localhost:${PORT}/test`);
            return res.status(200).send(result.data);
        } catch (error) {
            console.log("error message",error.message);
            return res.status(400).send(error.message);
        }
      
    });  

    // CART PAGE
    app.get('/cart', async (req, res) => {
        try {
            const user = await getUser(req);
            if (!user) return res.redirect('/');

            return res.render('cart', { name: user.name });
        } catch (error) {
            console.error('Cart view error:', error);
            return res.status(500).send('Server error');
        }
    });

    // MY ORDERS PAGE
    app.get('/myOrders', async (req, res) => {
        try {
            const user = await getUser(req);
            if (!user) return res.redirect('/');

            return res.render('myOrders', { name: user.name });
        } catch (error) {
            console.error('My Orders view error:', error);
            return res.status(500).send('Server error');
        }
    });
  




















    
    //ALI ---------------------------------------------------------------------------------------------------------------------
    app.get("/ownerDashboard", async (req, res) => {
        try {
            const user = await getUser(req);
            
            // Check if user is authenticated and is a truck owner
            if (!user || user.role !== 'truckOwner') {
                return res.status(403).redirect('/');
            }
            
            // Get truck owned by this user
            const truck = await db("FoodTruck.Trucks")
                .where({ ownerId: user.userId })
                .first();
            
            if (!truck) {
                return res.status(404).send('Truck not found');
            }

            // Get menu item count
            const menuCount = await db("FoodTruck.MenuItems")
                .where({ truckId: truck.truckId })
                .count("* as count");

            // Get pending orders count
            const pendingOrders = await db("FoodTruck.Orders")
                .where({ truckId: truck.truckId, orderStatus: "pending" })
                .count("* as count");

            // Get completed orders count
            const completedOrders = await db("FoodTruck.Orders")
                .where({ truckId: truck.truckId, orderStatus: "completed" })
                .count("* as count");

            // Get 3 most recent orders
            const recentOrders = await db("FoodTruck.Orders")
                .where({ truckId: truck.truckId })
                .orderBy("createdAt", "desc")
                .limit(3);

            res.render("ownerDashboard", {
                name: user.name,
                truckName: truck.truckName,
                availability: truck.orderStatus ? "available" : "unavailable",
                isAvailable: truck.orderStatus,
                menuCount: menuCount[0].count,
                pendingOrders: pendingOrders[0].count,
                completedOrders: completedOrders[0].count,
                recentOrders
            });
        } catch (error) {
            console.error('Owner Dashboard error:', error);
            return res.status(500).send('Server error');
        }
    });
//ALI ---------------------------------------------------------------------------------------------------------------------

app.get("/trucks", (req, res) => {
  try {
    res.render("trucks");
  } catch (error) {
    console.error('Trucks view error:', error);
    return res.status(500).send('Server error');
  }
});


//rahaffffffffffffffff
app.get("/dashboard", async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user) return res.redirect('/');
    if(user.role !== 'customer'){
      return res.redirect('ownerDashboard');
    }
    res.render("customerHomepage", {
      name: user.name
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).send('Server error');
  }
});

app.get("/truckMenu/:truckId", async (req, res) => {
  try {
    res.render("truckMenu");
  } catch (error) {
    console.error('Truck Menu view error:', error);
    return res.status(500).send('Server error');
  }
});
 // ===============================
  // MENU ITEMS PAGE (TRUCK OWNER)(ahmed)
  // ===============================
  app.get('/menuItems', async (req, res) => {
    try {
      const user = await getUser(req);

      if (!user || user.role !== 'truckOwner') {
        return res.status(403).redirect('/');
      }

      return res.render('menuItems', {
        name: user.name
      });

    } catch (error) {
      console.error('MenuItems view error:', error);
      return res.status(500).send('Server error');
    }
  });
  // ===============================
  // Add MENU ITEMS PAGE (TRUCK OWNER)(ahmed)
  // ===============================
  app.get('/addMenuItem', async (req, res) => {
    try {
      const user = await getUser(req);

      if (!user || user.role !== 'truckOwner') {
        return res.status(403).redirect('/');
      }

      const itemId = req.query.itemId || null;

      return res.render('addMenuItem', {
        name: user.name,
        itemId
      });

    } catch (error) {
      console.error('AddMenuItem view error:', error);
      return res.status(500).send('Server error');
    }
  });
  app.get('/truckOrders', async (req, res) => {
    try {
      const user = await getUser(req);

      if (!user || user.role !== 'truckOwner') {
        return res.status(403).redirect('/');
      }

      return res.render('truckOrders', {
        name: user.name
      });
    } catch (error) {
      console.error('Truck Orders view error:', error);
      return res.status(500).send('Server error');
    }
  });
}  

module.exports = { handlePrivateFrontEndView };

  
