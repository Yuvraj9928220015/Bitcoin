const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  author: { type: String, required: true, default: "Barosché" },
  image: { type: String, required: true },
  content: { type: String, required: true },

  pageTitle: { type: String, default: "" },
  metaDescription: { type: String, default: "" },
  urlHandle: { type: String, default: "" },

  script: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Blog", blogSchema);