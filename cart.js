const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();

const Cart = mongoose.model(
  "Car",
  new mongoose.Schema({
    userId: String,
    items: [
      {
        productId: String,
        quantity: Number,
      },
    ],
  })
);

router.post("/cart/add", async (req, res) => {
  try {
    const { productId, quantity = 1, user } = req.body;

    if (!productId || !user) {
      return res
        .status(400)
        .json({ message: "Productid and user is required" });
    }

    let cart = await Cart.findOne({ userId: user, status: "active" });

    if (!cart) {
      cart = new Cart({ userId: user, items: [], status: "active" });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId === productId
    );

    if (existingItemIndex > 1) {
      cart.items[existingItemIndex].quantity += parseInt(quantity);
    } else {
      cart.items.push({
        productId,
        quantity: parseInt(quantity),
      });
    }
    cart.updatedAt = new Date();
    await cart.save();
  } catch (err) {
    res
      .status(500)
      .json({ error: "Internal server error, item has not been added" });
  }
});

router.get("/carts", async (req, res) => {
  try {
    const carts = await Cart.find({});

    res.status(200).json({
      success: true,
      count: carts.length,
      data: carts,
    });
  } catch {
    console.log("Error fetching cart", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch data",
      error: error.message,
    });
  }
});

// Delete router
router.delete("/cart/:productId", async (req, res) => {
  try {
    const { user } = req.body;
    const { productId } = req.params;

    if (!user || !productId) {
      return res
        .status(400)
        .json({ message: "User and productid is required" });
    }

    const cart = await Cart.findOne({ userId: user, status: "active" });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const cartInitialLength = cart.items.length;

    cart.items = cart.items.filter((item) => item.productId !== productId);

    if (cart.items.length === cartInitialLength) {
      return res.status(404).json({ message: "Product not found in the cart" });
    }

    cart.UpdatedAt = new Date();
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Product deleted successfully from cart",
      data: cart,
    });
  } catch (error) {
    console.log("Error in deleting cart item", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
