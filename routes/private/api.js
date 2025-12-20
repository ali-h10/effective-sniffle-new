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
  

//API: add items to cart [ ALI DID IT :) ] -----------------------------------------------------------
app.post("/api/v1/cart/new",async(req,res)=>{
   try{
  const { itemId, quantity, price }=req.body;

  if (!itemId || !quantity || !price) {
      return res.status(400).json({ message: "Missing required fields" });
    }

  const user = await getUser(req);
  const userId = user.userId; 

  const menuItem = await db("FoodTruck.MenuItems")
  .where({itemId,status:"available"})
  .first(); // .first() so we can get the object instead of the array

  if(!menuItem){
    return res.status(404).json({ message: "Item not found or unavailable" });
  }

  const newItemTruckId = menuItem.truckId;

    const existingCartItems = await db("FoodTruck.Carts")
      .where({ userId })
      .join("FoodTruck.MenuItems", "Carts.itemId", "MenuItems.itemId")
      .select("MenuItems.truckId");

    if (existingCartItems.length > 0) {
      const existingTruckId = existingCartItems[0].truckId;

      if (existingTruckId !== newItemTruckId) {
        return res.status(400).json({
          message: "Cannot order from multiple trucks",
        });
      }
    }

    await db("FoodTruck.Carts").insert({
      userId,
      itemId,
      quantity,
      price: price*quantity,
    });

    return res.status(200).json({
      message: "item added to cart successfully",
    });

   } catch(error){
    console.error(error);
    return res.status(500).json({error: 'Internal Server Error'});
   }
});

// 3️⃣ PUT update truck order availability(Rawda)
// ----------------------
app.put("/api/v1/trucks/updateOrderStatus", async (req, res) => {
    try {
        const { orderStatus } = req.body;

        // Validate input
        if (!orderStatus || !["available", "unavailable"].includes(orderStatus)) {
            return res.status(400).json({ error: "Invalid orderStatus value" });
        }

        // Get current truck owner's truckId
        const user = await getUser(req);
        const truckId = user.truckId;

        if (!truckId) {
            return res.status(404).json({ error: "Truck not found for this owner" });
        }

        // Update orderStatus for this truck only
        await db("FoodTruck.Trucks")
            .where({ truckId })
            .update({ orderStatus });

        console.log("Update truck order status route hit for truckId:", truckId);
        res.json({ message: "truck order status updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});







//API: Update Order Status [ ALI DID IT and hopes he doesnt face more 500 errors :) ]-----------------------------
app.put("/api/v1/order/updateStatus/:orderId",async (req,res)=>{

 try {
    const { orderId } = req.params;
    const { orderStatus, estimatedEarliestPickup } = req.body;

    const validStatuses = ["pending", "preparing", "ready", "completed", "cancelled"];

    // 1. Validate the new status
    if (!validStatuses.includes(orderStatus)) {     //checking if the old order status is inside the validstatus array or not 
      return res.status(400).json({ error: "Invalid order status" });
    }

    // 2. Get logged-in truck owner
    const user = await getUser(req);
    const ownerTruckId = user.truckId; 

    if (!ownerTruckId) {
      return res.status(403).json({ error: "You are not a truck owner" });
    }

    // 3. Check that the order belongs to this truck
    const order = await db("FoodTruck.Orders")
      .where({ orderId })
      .first();         //returns the order object (record) 

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.truckId !== ownerTruckId) {     // checks if the order and the user (vendor) are from the same truck
      return res.status(403).json({ error: "Not authorized to update this order" });
    }

    // 4. Build update payload
    const updateData = { orderStatus }; //creates an object that has the new status in the perameters

    if (estimatedEarliestPickup) {
      updateData.estimatedEarliestPickup = estimatedEarliestPickup;
    }

    // 5. Update the order
    await db("FoodTruck.Orders")
      .where({ orderId })
      .update(updateData);

    // 6. Success response
    return res.status(200).json({
      message: "order status updated successfully"
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }

})


//API:Search Menu Items by Category [ ALI DID IT and hopes he doesnt face more 500 errors :) ]-------------------
app.get("/api/v1/menuItem/truck/:truckId/category/:category", async (req, res) => {
  try {
    const { truckId, category } = req.params;

    // Validate required params
    if (!truckId || !category) {
      return res.status(400).json({ error: "truckId and category are required" });
    }

    // Fetch menu items matching truckId, category, and status = 'available'
    const menuItems = await db("FoodTruck.MenuItems")
      .where({
        truckId: parseInt(truckId),
        category: category,
        status: "available",
      })
      .select(
        "itemId",
        "truckId",
        "name",
        "description",
        "price",
        "category",
        "status",
        "createdAt"
      )
      .orderBy("itemId", "asc"); // sort by itemId ascending

    return res.status(200).json(menuItems);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

//rahaf.....................................................................................
app.post('/api/v1/menuItem/new' ,  async (req, res)  => {
  try {
    // 1️⃣ Get logged-in user (from session cookie)
    const user = await getUser(req);

    // Ensure the user is a truck owner
    if (!user || user.role !== "truckOwner") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // 2️⃣ Owner must have a truck (your getUser already merges truck info)
    const truckId = user.truckId;

    if (!truckId) {
      return res.status(400).json({
        message: "Truck owner does not have a truck assigned",
      });
    }

    // 3️⃣ Extract fields from request body
    const { name, price, description, category } = req.body;

    // Validation
    if (!name || !price || !category) {
      return res.status(400).json({
        message: "name, price, and category are required",
      });
    }

    // 4️⃣ Insert new record into MenuItems (status & createdAt use defaults)
    const [createdItem] = await db("FoodTruck.MenuItems")
      .insert({
        truckId,
        name,
        price,
        description,
        category,
      })
      .returning("*");

    // 5️⃣ Send success message
    return res.status(201).json({
      message: "menu item was created successfully",
      item: createdItem,
    });
  } catch (err) {
    console.error("Error creating menu item:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
});

//rahaf.....................................................................................
app.put('/api/v1/menuItem/edit/:itemId', async (req, res) => {
  try {
    // 1️⃣ Get logged-in user
    const user = await getUser(req);

    if (!user || user.role !== "truckOwner") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const truckId = user.truckId;

    if (!truckId) {
      return res.status(400).json({
        message: "Truck owner does not have a truck assigned",
      });
    }

    // 2️⃣ Extract itemId from params
    const itemId = req.params.itemId;

    // 3️⃣ Check if the menu item exists AND belongs to this truck
    const item = await db("FoodTruck.MenuItems")
      .where({ itemId })
      .first();

    if (!item) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    if (item.truckId !== truckId) {
      return res.status(403).json({
        message: "You can only update menu items of your own truck",
      });
    }

    // 4️⃣ Build the updated fields (only what user sends)
    const updateData = {};
    const allowedFields = ["name", "price", "description", "category", "status"];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "No valid fields provided for update",
      });
    }

    // 5️⃣ Update the item in the database
    const [updatedItem] = await db("FoodTruck.MenuItems")
      .where({ itemId })
      .update(updateData)
      .returning("*");

    // 6️⃣ Respond with success
    return res.json({
      message: "menu item was updated successfully",
      item: updatedItem,
    });
  } catch (error) {
    console.error("Error updating menu item:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});
  // view all orders for a truck owner (ahmed) 
  app.get("/api/v1/order/truckOrders", async (req, res) => {
  try {
    // 1. Get the current logged-in truck owner
    const user = await getUser(req);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized: No session found" });
    }  
  // 2. Ensure only truck owners can access it
    if (user.role !== "truckOwner") {
      return res.status(403).json({ error: "Only truck owners can view truck orders" });
    }

    // 3. Get owner’s truckId
    const truckId = user.truckId;
    if (!truckId) {
      return res.status(400).json({ error: "No truck found for this owner" });
    }

    // 4. Fetch all orders for this truck, joined with Users table
    const orders = await db("FoodTruck.Orders as o")
      .select(
        "o.orderId",
        "o.userId",
        db.raw("u.name as customerName"),
        "o.orderStatus",
        "o.totalPrice",
        "o.scheduledPickupTime",
        "o.estimatedEarliestPickup",
        "o.createdAt"
      )
      .innerJoin("FoodTruck.Users as u", "o.userId", "u.userId")
      .where("o.truckId", truckId)
      .orderBy("o.orderId", "desc");   // most recent first

    // 5. Send response
    return res.status(200).json(orders);

  } catch (error) {
    console.error("Error fetching truck orders:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
// view specific order details for a truck owner (ahmed)
app.get("/api/v1/order/truckOwner/:orderId",async(req,res)=>{
 try{ 
  const user = await getUser(req);
  const orderId = req.params.orderId;
  const truckId = user.truckId;
  if(!user){
    return res.status(401).json({ error: "Unauthorized: No session found" });
  }
  if(user.role !== "truckOwner"){
    return res.status(403).json({ error: "Only truck owners can view truck orders" });
  }
  const order= await db("FoodTruck.Orders").select("*").where("orderId", orderId).first();
   if (!order) {
    return res.status(404).json({ error: "Order not found" });
    }
  if(order.truckId !== truckId){
    return res.status(403).json({error:"order for another Truck"});
  }
  const items = await db("FoodTruck.OrderItems as oi")
  .select(
      "m.name as itemName",
      "oi.quantity",
      "oi.price"
    )
  .innerJoin("FoodTruck.MenuItems as m","oi.itemId","m.itemId") 
  .where("oi.orderId",orderId);
  const orderDetails = {
      orderId: order.orderId,
      truckName: user.truckName,
      orderStatus: order.orderStatus,
      totalPrice: order.totalPrice,
      scheduledPickupTime: order.scheduledPickupTime,
      estimatedEarliestPickup: order.estimatedEarliestPickup,
      createdAt: order.createdAt,
      items: items
  }
  res.json(orderDetails);
}
 catch(error)
 {
  console.error(error);
  res.status(500).json({ error: 'Internal Server Error' });
 }





//rahaf.....................................................................................
app.get('/api/v1/trucks/myTruck', async (req, res) => {
  try {
    // 1️⃣ Get logged-in user
    const user = await getUser(req);

    // Ensure the user is a truck owner
    if (!user || user.role !== "truckOwner") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // 2️⃣ Get truckId from user object (provided by getUser)
    const { truckId } = user;

    if (!truckId) {
      return res.status(404).json({
        message: "This truck owner does not have a truck assigned",
      });
    }

    // 3️⃣ Fetch truck info
    const truck = await db("FoodTruck.Trucks")
      .where({ truckId })
      .first();

    if (!truck) {
      return res.status(404).json({ message: "Truck not found" });
    }

    // 4️⃣ Respond with truck data
    return res.json({
      message: "Truck information retrieved successfully",
      truck,
    });

  } catch (error) {
    console.error("Error getting truck info:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});


});
// edit cart item quantity for a customer (ahmed)
app.put("/api/v1/cart/edit/:cartId",async(req,res)=>{
  try {
    const user = await getUser(req);
    const cartId = req.params.cartId;
    const  {quantity}  = req.body; // Expecting an array of { quantity }
    if (!user) {
      return res.status(401).json({ error: "Unauthorized: No session found" });
    }
    if(user.role !=="customer"){
      return res.status(403).json({ error: "Only customers can edit cart items" });
    }
    // Check if the cart item belongs to the user
    const cartItem = await db("FoodTruck.Carts").select("*").where("cartId", cartId).first();
    if(cartItem.userId!==user.userId){
      res.status(403).json({ error: "This cart item does not belong to the user" });
    }   
    // Update the quantity
    const item= await db("FoodTruck.MenuItems").select("*").where("itemId", cartItem.itemId).first();
    const price = item.price * quantity;
    await db("FoodTruck.Carts").where("cartId", cartId).update({ quantity: quantity,price: price });
    res.status(200).json({ message: "Cart updated successfully" });
  } catch (error) {
  console.error(error);
  res.status(500).json({ error: 'Internal Server Error' });
  }
});
// delete cart item for a customer (ahmed)
app.delete("/api/v1/cart/delete/:cartId", async (req, res) => {
  try {
    const user = await getUser(req);
    const cartId = req.params.cartId;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized: No session found" });
    }
    if(user.role !=="customer"){
      return res.status(403).json({ error: "Only customers can delete cart items" });
    }
    // Check if the cart item belongs to the user
    const cartItem = await db("FoodTruck.Carts").select("*").where("cartId", cartId).first();
    if(cartItem.userId!==user.userId){
      res.status(403).json({ error: "This cart item does not belong to the user" });
    }   
    // Delete the cart item
    await db("FoodTruck.Carts").where("cartId", cartId).del();
    res.status(200).json({ message: "Cart item deleted successfully" });
  } catch (error) {
  console.error(error);
  res.status(500).json({ error: 'Internal Server Error' });
  }
});


// 1️⃣ View all menu items for the truck owner mariam )))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))
app.get('/api/v1/menuItem/view', async (req, res) => {
  try {
    const user = await getUser(req);
    const truckId = user.truckId;

    if (!truckId) {
      return res.status(403).json({ message: "No truck found for this user" });
    }

    // Get all available menu items for this truck
    const menuItems = await db.select('*')
      .from('FoodTruck.MenuItems')
      .where('truckId', truckId)
      .andWhere('status', 'available')
      .orderBy('itemId');

    return res.status(200).json(menuItems);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// 2️⃣ View a specific menu item  mariam )))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))
app.get('/api/v1/menuItem/view/:itemId', async (req, res) => {
  try {
    const user = await getUser(req);
    const truckId = user.truckId;
    const itemId = req.params.itemId;

    if (!truckId) {
      return res.status(403).json({ message: "No truck found for this user" });
    }

    const menuItem = await db.select('*')
      .from('FoodTruck.MenuItems')
      .where('truckId', truckId)
      .andWhere('itemId', itemId)
      .first();

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    return res.status(200).json(menuItem);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// 3️⃣ Delete a menu item (mark as unavailable)  mariam )))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))
app.delete('/api/v1/menuItem/delete/:itemId', async (req, res) => {
  try {
    const user = await getUser(req);
    const truckId = user.truckId;
    const itemId = req.params.itemId;

    if (!truckId) {
      return res.status(403).json({ message: "No truck found for this user" });
    }

    const result = await db('FoodTruck.MenuItems')
      .where('truckId', truckId)
      .andWhere('itemId', itemId)
      .delete( '*' );

    if (result === 0) {
      return res.status(404).json({ message: 'Menu item not found or not yours' });
    }

    return res.status(200).json({ message: 'menu item deleted successfully' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});


  
//menna+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    app.get("/api/v1/cart/view", async (req, res) => {
  try {
    // 1. Get the logged-in user
    const user = await getUser(req);
    const userId = user.userId;
  // 2. Get all cart items for this user
    const cartItems = await db("FoodTruck.Carts")
      .where({ userId })
      .join("FoodTruck.MenuItems", "Carts.itemId", "MenuItems.itemId")
      .select(
        "Carts.cartId",
        "Carts.userId",
        "Carts.itemId",
        "MenuItems.name as itemName",
        "Carts.price",
        "Carts.quantity"
      )
      .orderBy("Carts.cartId", "asc");
    // 3. Respond with the cart items
    return res.status(200).json(cartItems);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Internal server error"
    });
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
   // already declared earlier
// const { scheduledPickupTime } = req.body; 

// Convert HH:MM into a full timestamp
const now = new Date();
const [hour, minute] = scheduledPickupTime.split(":").map(Number);
const scheduledDate = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate(),
  hour,
  minute,
  0
);

// Insert into DB
const [newOrder] = await db("FoodTruck.Orders")
  .insert({
    userId: user.userId,
    truckId,
    orderStatus: "pending",
    scheduledPickupTime: scheduledDate,
    estimatedEarliestPickup: scheduledDate,
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

      if (!user) {
          return res.status(401).json({ error: "Unauthorized: No session found" });
      }

      if (user.role !== "customer") {
          return res.status(403).json({ error: "Only customers can view their orders" });
      }

      const userId = user.userId;
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

const { getSessionToken, clearSession } = require('../../utils/session');
const db = require('../../connectors/db');

app.get('/logout', async (req, res) => {
  const sessionToken = getSessionToken(req);

  if (sessionToken) {
    await db('FoodTruck.Sessions').where({ token: sessionToken }).del();
  }

  clearSession(req);
  res.redirect('/login');
});
};

module.exports = {handlePrivateBackendApi};
