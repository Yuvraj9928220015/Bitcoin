const express = require("express");
const multer = require("multer");
const slugify = require("slugify");
const fs = require("fs");
const path = require("path");
const Blog = require("../models/Blog.js");

const router = express.Router();

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "-")),
});

const upload = multer({ storage });

async function findBlog(identifier) {
  if (!identifier) return null;
  let blog = await Blog.findOne({ urlHandle: identifier });
  if (!blog) blog = await Blog.findOne({ slug: identifier });
  return blog;
}

function cleanHandle(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

router.post("/upload-image", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image required!" });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ url: imageUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: "Image upload failed", error: error.message });
  }
});

router.get("/migrate/add-fields", async (req, res) => {
  try {
    const blogs = await Blog.find();
    let updated = 0;

    for (const blog of blogs) {
      let changed = false;
      if (!blog.pageTitle) { blog.pageTitle = blog.title; changed = true; }
      if (!blog.metaDescription) { blog.metaDescription = ""; changed = true; }
      if (!blog.urlHandle) { blog.urlHandle = blog.slug; changed = true; }
      if (!blog.script) { blog.script = ""; changed = true; }
      if (!blog.altTag) { blog.altTag = blog.title || ""; changed = true; }
      if (changed) { await blog.save(); updated++; }
    }

    res.json({ success: true, message: `${updated} blogs updated!` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, author, content, pageTitle, metaDescription, urlHandle, script, altTag } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: "Title and Content required!" });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : "";
    const autoSlug = slugify(title, { lower: true, strict: true });
    const finalHandle = urlHandle ? cleanHandle(urlHandle) : autoSlug;

    const exists = await Blog.findOne({ urlHandle: finalHandle });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Yeh URL handle already exist karta hai. Koi aur choose karo.",
      });
    }

    const newBlog = new Blog({
      title,
      slug: autoSlug,
      author: author || "Bitcoin Butik",
      content,
      image: imageUrl,
      altTag: altTag || title,
      pageTitle: pageTitle || title,
      metaDescription: metaDescription || "",
      urlHandle: finalHandle,
      script: script || "",
    });

    const saved = await newBlog.save();
    res.status(201).json({ success: true, message: "Blog saved!", blog: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error saving blog", error: error.message });
  }
});

// GET ALL
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching blogs", error: error.message });
  }
});

router.get("/:identifier", async (req, res) => {
  try {
    const blog = await findBlog(req.params.identifier);
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ message: "Error fetching blog", error: error.message });
  }
});

// UPDATE
router.put("/:identifier", upload.single("image"), async (req, res) => {
  try {
    const { title, author, content, pageTitle, metaDescription, urlHandle, script, altTag } = req.body;

    const blog = await findBlog(req.params.identifier);
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });

    if (urlHandle) {
      const newHandle = cleanHandle(urlHandle);
      if (newHandle !== blog.urlHandle) {
        const conflict = await Blog.findOne({ urlHandle: newHandle, _id: { $ne: blog._id } });
        if (conflict) {
          return res.status(400).json({ success: false, message: "Yeh URL handle already exist karta hai." });
        }
        blog.urlHandle = newHandle;
      }
    }

    blog.title = title || blog.title;
    blog.author = author || blog.author;
    blog.content = content || blog.content;
    blog.image = req.file ? `/uploads/${req.file.filename}` : blog.image;
    blog.altTag = altTag !== undefined ? altTag : blog.altTag;
    blog.pageTitle = pageTitle || blog.pageTitle;
    blog.metaDescription = metaDescription !== undefined ? metaDescription : blog.metaDescription;
    blog.script = script !== undefined ? script : blog.script;

    const updated = await blog.save();
    res.status(200).json({
      success: true,
      message: "Blog updated!",
      blog: updated,
      newSlug: updated.urlHandle,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating blog", error: error.message });
  }
});

// DELETE
router.delete("/:identifier", async (req, res) => {
  try {
    const blog = await findBlog(req.params.identifier);
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });

    await Blog.findByIdAndDelete(blog._id);
    res.status(200).json({ success: true, message: "Blog deleted!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting blog", error: error.message });
  }
});

module.exports = router;