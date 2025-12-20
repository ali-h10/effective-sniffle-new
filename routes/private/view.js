const db = require('../../connectors/db');
const { getSessionToken , getUser } = require('../../utils/session');
const axios = require('axios');
require('dotenv').config();
const PORT = process.env.PORT || 3001;

function handlePrivateFrontEndView(app) {

   app.get('/dashboard' , async (req , res) => {
        
        const user = await getUser(req);
        if(user.role == "truckOwner"){
            return res.render('ownerDashboard' , {name : user.name});
        }
        // role of customer
        return res.render('customerHomepage' , {name : user.name});
    });

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
    const user = await getUser(req);
    if (!user) return res.redirect('/login');

    return res.render('cart');
});

// MY ORDERS PAGE
app.get('/myOrders', async (req, res) => {
    const user = await getUser(req);
    if (!user) return res.redirect('/login');

    return res.render('myOrders');
});




















    
    //ALI ---------------------------------------------------------------------------------------------------------------------
    app.get("/ownerDashboard", async (req, res) => {
  const user = await getUser(req);

  const truck = await db("FoodTruck.Trucks")
    .where({ ownerId: user.userId })
    .first();

  const menuCount = await db("FoodTruck.MenuItems")
    .where({ truckId: truck.truckId })
    .count("* as count");

  const pendingOrders = await db("FoodTruck.Orders")
    .where({ truckId: truck.truckId, orderStatus: "pending" })
    .count("* as count");

  const completedOrders = await db("FoodTruck.Orders")
    .where({ truckId: truck.truckId, orderStatus: "completed" })
    .count("* as count");

  const recentOrders = await db("FoodTruck.Orders")
    .where({ truckId: truck.truckId })
    .orderBy("createdAt", "desc")
    .limit(3);

  res.render("ownerDashboard", {
    username: user.name,
    truckName: truck.truckName,
    availability: truck.orderStatus ? "available" : "unavailable",
    isAvailable: truck.orderStatus ,
    menuCount: menuCount[0].count,
    pendingOrders: pendingOrders[0].count,
    completedOrders: completedOrders[0].count,
    recentOrders
  });
});


//ALI ---------------------------------------------------------------------------------------------------------------------

app.get("/trucks", (req, res) => {
  res.render("trucks");
});


//rahaffffffffffffffff
app.get("/dashboard", async (req, res) => {
  const user = await getUser(req);

  res.render("customerHomepage", {
    username: user.name
  });
});

app.get("/truckMenu/:truckId", async (req, res) => {
  res.render("truckMenu");
});
}  

module.exports = { handlePrivateFrontEndView };




  
