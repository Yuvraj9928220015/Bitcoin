require("dotenv").config(); // ✅ MUST

const mongoose = require("mongoose");
const Product = require("../models/productModel");

const MONGO_URL = 'mongodb://bituser:Bitcoinbutik%402111@93.127.172.98:27017/Bitcoine?authSource=Bitcoine';

const createSlug = (name) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");

async function run() {
  await mongoose.connect(MONGO_URL);

  const products = await Product.find();

  for (let p of products) {
    if (!p.slug) {
      p.slug = createSlug(p.title);
      await p.save();
    }
  }

  console.log("✅ All slugs updated");
  process.exit();
}

run();