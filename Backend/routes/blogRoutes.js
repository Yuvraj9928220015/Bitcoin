const express = require("express");
const multer = require("multer");
const slugify = require("slugify");
const fs = require("fs");
const Blog = require("../models/Blog.js");

const router = express.Router();

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "-"));
  },
});

const upload = multer({ storage });


router.get("/migrate/add-fields", async (req, res) => {
  try {
    const blogs = await Blog.find();
    let updated = 0;

    for (const blog of blogs) {
      let changed = false;

      if (!blog.pageTitle) {
        blog.pageTitle = blog.title;
        changed = true;
      }
      if (blog.metaDescription === undefined || blog.metaDescription === null) {
        blog.metaDescription = "";
        changed = true;
      }
      if (!blog.urlHandle) {
        blog.urlHandle = blog.slug;
        changed = true;
      }
      if (blog.script === undefined || blog.script === null) {
        blog.script = "";
        changed = true;
      }
      if (blog.altTag === undefined || blog.altTag === null) { blog.altTag = blog.title || ""; changed = true; }

      if (changed) {
        await blog.save();
        updated++;
      }
    }

    res.json({ success: true, message: `${updated} blogs updated!` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 1. CREATE NEW BLOG
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, author, content, pageTitle, metaDescription, urlHandle, script, altTag  } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: "Title and Content are required!" });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : "";
    const slug = slugify(title, { lower: true, strict: true });

    const newBlog = new Blog({
      title,
      slug,
      author: author || "Barosché",
      content,
      image: imageUrl,
      altTag: altTag || title,
      pageTitle: pageTitle || title,
      metaDescription: metaDescription || "",
      urlHandle: urlHandle || slug,
      script: script || "",
    });

    const savedBlog = await newBlog.save();
    res.status(201).json({ success: true, message: "Blog saved successfully!", blog: savedBlog });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error saving blog", error: error.message });
  }
});

// 2. GET ALL BLOGS
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching blogs", error: error.message });
  }
});

// 3. GET SINGLE BLOG
router.get("/:slug", async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ message: "Error fetching blog", error: error.message });
  }
});

// 4. UPDATE BLOG
router.put("/:slug", upload.single("image"), async (req, res) => {
  try {
    const { title, author, content, pageTitle, metaDescription, urlHandle, script } = req.body;
    const existingBlog = await Blog.findOne({ slug: req.params.slug });

    if (!existingBlog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : existingBlog.image;

    existingBlog.title = title || existingBlog.title;
    existingBlog.author = author || existingBlog.author;
    existingBlog.content = content || existingBlog.content;
    existingBlog.image = imageUrl;
    existingBlog.altTag = altTag !== undefined ? altTag : existingBlog.altTag; 
    existingBlog.pageTitle = pageTitle || existingBlog.pageTitle;
    existingBlog.metaDescription = metaDescription || existingBlog.metaDescription;
    existingBlog.urlHandle = urlHandle || existingBlog.urlHandle;
    existingBlog.script = script || existingBlog.script;

    const updatedBlog = await existingBlog.save();
    res.status(200).json({ success: true, message: "Blog updated successfully!", blog: updatedBlog });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating blog", error: error.message });
  }
});

// 5. DELETE BLOG
router.delete("/:slug", async (req, res) => {
  try {
    const deleted = await Blog.findOneAndDelete({ slug: req.params.slug });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }
    res.status(200).json({ success: true, message: "Blog deleted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting blog", error: error.message });
  }
});

module.exports = router;