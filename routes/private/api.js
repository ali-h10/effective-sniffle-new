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







  




};



module.exports = {handlePrivateBackendApi};
