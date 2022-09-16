const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const cors = require("cors");
const jwt = require("jsonwebtoken")

// middleware
app.use(cors());
app.use(express.json());


//AUTH
app.post('/login', async(req, res)=>{
  const user = req.body;
  const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN,{
    expiresIn:"1d"
  });
  res.send({accessToken})
})
function verifyJWT(req,res,next){
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message:"unAuthorized access"})
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded)=>{
    if(err){
      return res.status(403).send({message:"FORBIDDEN"})
    }
    req.decoded = decoded
  })
  next()

}

//mongodb

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nq7ims6.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const FruitsCollection = client.db("FruitShop").collection("Fruits");
    const OrderCollection = client.db("FruitShop").collection("Orders");
    //get api documents
    app.get("/fruits", async (req, res) => {
      const query = {};
      const cursor = FruitsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    //find a single document
    app.get("/fruits/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const fruit = await FruitsCollection.findOne(query);
      res.send(fruit);
    });
    //insert a document
    app.post("/fruit", async (req, res) => {
      const newFruit = req.body;
      const result = await FruitsCollection.insertOne(newFruit);
      res.send(result);
    });
  //delete a document
  app.delete("/fruit/:id", async(req, res)=>{
    const id = req.params.id;
    const query = {_id:ObjectId(id)};
    const result = await FruitsCollection.deleteOne(query);
    res.send(result)
  })
  //insert an order
app.post("/order", async(req,res)=>{
  const order = req.body;
  const result = await OrderCollection.insertOne(order);
  res.send(result)
});
//find orders
app.get("/orders",verifyJWT, async(req,res)=>{
  const decodedUid = req.decoded.uid
  const uid = req.query.uid;
  if(decodedUid === uid){
    const query = {uid:uid};
  const cursor = OrderCollection.find(query);
  const result = await cursor.toArray();
  res.send(result)
  }
  else{
    res.status(403).send({message:"FORBIDDEN"})
  }
})
  } finally {
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Hello from my foodshop!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
