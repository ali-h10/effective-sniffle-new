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













  




};



module.exports = {handlePrivateBackendApi};
