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

// 3️⃣ PUT update truck order availability
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




























  




};



module.exports = {handlePrivateBackendApi};
