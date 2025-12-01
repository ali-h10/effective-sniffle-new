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
app.post("/cart/new",async(req,res)=>{
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
      price,
    });

    return res.status(200).json({
      message: "item added to cart successfully",
    });

   } catch(error){
    console.error(error);
    return res.status(500).json({error: 'Internal Server Error'});
   }
});





//API: Update Order Status [ ALI DID IT and hopes he doesnt face more 500 errors :) ]-----------------------------
app.put('/updateStatus/:orderId',async (req,res)=>{

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
app.get("/menuItem/truck/:truckId/category/:category", async (req, res) => {
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























  




};



module.exports = {handlePrivateBackendApi};
