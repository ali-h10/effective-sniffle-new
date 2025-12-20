const db = require('../../connectors/db');
const { getSessionToken , getUser } = require('../../utils/session');
const axios = require('axios');
require('dotenv').config();
const {authMiddleware} = require('../../middleware/auth');
const PORT = process.env.PORT || 3001;

function handlePrivateFrontEndView(app) {

    app.get('/dashboard' , async (req , res) => {
        
        const user = await getUser(req);
        if(user.role == "truckOwner"){
            return res.render('truckOwnerHomePage' , {name : user.name});
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
  


































































































    // ===============================
  // MENU ITEMS PAGE (TRUCK OWNER)(ahmed)
  // ===============================
  app.get('/menuItems', authMiddleware, async (req, res) => {
    try {
      const user = await getUser(req);

      if (user.role !== 'truckOwner') {
        return res.status(403).render('customerHomepage', {
          name: user.name,
          error: 'Access denied'
        });
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
    app.get('/addMenuItem', authMiddleware, async (req, res) => {
    try {
      const user = await getUser(req);

      if (user.role !== 'truckOwner') {
        return res.status(403).render('customerHomepage', {
          name: user.name,
          error: 'Access denied'
        });
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
  app.get('/truckOrders', authMiddleware, async (req, res) => { 
    res.render('truckOrders');
  });

}
  
module.exports = {handlePrivateFrontEndView};
  