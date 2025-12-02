const db = require('../../connectors/db');
// check function getUser in milestone 3 description and session.js
const {getUser} = require('../../utils/session');
// getUser takes only one input of req 
// await getUser(req);

function handlePrivateBackendApi(app) {
  
  // insert all your private server side end points here
  app.get('/test' , async (req,res) => {
     try{
      return res.status(200).send("succesful connection");
     }catch(err){
      console.log("error message", err.message);
      return res.status(400).send(err.message)
     }    
  });
  
// POST /api/v1/order/new Nadine 
  //Request Body: { scheduledPickupTime }

app.post("/api/v1/order/new", async (req, res) => {
  try {
    const user = await getUser(req);

    // 1. Only customers can order
    if (!user || user.role !== "customer") {
      return res.status(403).json({ error: "Only customers can place orders" });
    }

    const { scheduledPickupTime } = req.body;

    // 2. Get all cart items for this user
    const cartItems = await db("FoodTruck.Carts")
      .where("userId", user.userId)
      .select("*");

    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // 3. Get menu item details
    const itemIds = cartItems.map(ci => ci.itemId);

    const menuItems = await db("FoodTruck.MenuItems")
      .whereIn("itemId", itemIds);

    // 4. Verify all items belong to SAME TRUCK
    const truckIds = new Set(menuItems.map(mi => mi.truckId));

    if (truckIds.size !== 1) {
      return res.status(400).json({ error: "Cannot order from multiple trucks" });
    }

    const truckId = [...truckIds][0];

    // 5. Calculate total price
    let totalPrice = 0;

    for (const item of cartItems) {
      const menuItem = menuItems.find(m => m.itemId === item.itemId);
      totalPrice += Number(menuItem.price) * item.quantity;
    }

    // 6. Insert the order
    const [newOrder] = await db("FoodTruck.Orders")
      .insert({
        userId: user.userId,
        truckId,
        orderStatus: "pending",
        scheduledPickupTime,
        estimatedEarliestPickup: scheduledPickupTime, // your story says to set it
        totalPrice
      })
      .returning("*");

    // 7. Insert into OrderItems
    for (const item of cartItems) {
      const menuItem = menuItems.find(m => m.itemId === item.itemId);

      await db("FoodTruck.OrderItems").insert({
        orderId: newOrder.orderId,
        itemId: item.itemId,
        quantity: item.quantity,
        price: menuItem.price
      });
    }

    // 8. Clear the cart
    await db("FoodTruck.Carts").where("userId", user.userId).del();

    return res.status(200).json({
      message: "order placed successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
  // VIEW MY ORDERS ENDPOINT Nadine 
 app.get("/api/v1/order/myOrders", async (req, res) => {
  try {
      const user =await getUser(req);
      console.log (user.role);

      if (!user) {
          return res.status(401).json({ error: "Unauthorized: No session found" });
      }

      if (user.role !== "customer") {
          return res.status(403).json({ error: "Only customers can view their orders" });
      }

      const userId = user.id;


      const orders = await db("FoodTruck.Orders as o")
          .join("FoodTruck.Trucks as t", "o.truckId", "t.truckId")
          .where("o.userId", userId)
          .select(
              "o.orderId",
              "o.userId",
              "o.truckId",
              "t.truckName",
              "o.orderStatus",
              "o.totalPrice",
              "o.scheduledPickupTime",
              "o.estimatedEarliestPickup",
              "o.createdAt"
          )
          .orderBy("o.orderId", "desc"); // newest first

      const formattedOrders = orders.map(order => ({
          orderId: order.orderId,
          userId: order.userId,
          truckId: order.truckId,
          truckName: order.truckName,
          orderStatus: order.orderStatus,
          totalPrice: parseFloat(order.totalPrice),
          scheduledPickupTime: order.scheduledPickupTime,
          estimatedEarliestPickup: order.estimatedEarliestPickup,
          createdAt: order.createdAt
      }));

      res.status(200).json(formattedOrders);

  } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Internal server error" });
  }
});
  // VIEW MY ORDERS details ENDPOINT Nadine 
 app.get("/api/v1/order/details/:orderId", async (req, res) => {
  try {
    const user = await getUser(req);          // current customer ID
    const orderId = req.params.orderId;   // order to be viewed

    if (!user.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // --------------------------------------------------
    // Step 1: Get order + verify it belongs to this user
    // --------------------------------------------------
    const order = await db("FoodTruck.Orders as o")
      .join("FoodTruck.Trucks as t", "o.truckId", "t.truckId")
      .select(
        "o.orderId",
        "t.truckName",
        "o.orderStatus",
        "o.totalPrice",
        "o.scheduledPickupTime",
        "o.estimatedEarliestPickup",
        "o.createdAt",
        "o.userId"
      )
      .where("o.orderId", orderId)
      .first();

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.userId !== user.userId) {
      return res.status(403).json({ error: "Forbidden: Not your order" });
    }

    // Remove userId from final output
    delete order.userId;

    // --------------------------------------------------
    // Step 2: Get order items with MenuItems join
    // --------------------------------------------------
    const items = await db("FoodTruck.OrderItems as oi")
      .join("FoodTruck.MenuItems as mi", "oi.itemId", "mi.itemId")
      .select(
        "mi.name",
        "oi.quantity",
        "oi.price"
      )
      .where("oi.orderId", orderId);

    // --------------------------------------------------
    // Step 3: Build orderDetails object
    // --------------------------------------------------
    const orderDetails = {
      ...order,
      items
    };

    return res.status(200).json(orderDetails);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

};

module.exports = {handlePrivateBackendApi};
