const paypal = require("../../helpers/paypal");
const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const { sendMail, invoiceTemplate } = require("../../services/mail-service");
const User = require("../../models/User");

const createOrder = async (req, res) => {
  try {
    const {
      userId,
      cartItems,
      addressInfo,
      orderStatus,
      paymentMethod,
      paymentStatus,
      totalAmount,
      orderDate,
      orderUpdateDate,
      cartId,
    } = req.body;
    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        return_url: `${process.env.CLIENT_URL}/shop/payment-success`,
        cancel_url: `${process.env.CLIENT_URL}/shop/payment-cancel`,
      },
      transactions: [
        {
          item_list: {
            items: cartItems.map((item) => ({
              name: item.title,
              sku: item.productId,
              price: item.price.toFixed(2),
              currency: "USD",
              quantity: item.quantity,
            })),
          },
          amount: {
            currency: "USD",
            total: totalAmount.toFixed(2),
          },
          description: "description",
        },
      ],
    };

    paypal.payment.create(create_payment_json, async (error, paymentInfo) => {
      /*this will send you the payment link, which you have sent to the user*/
      if (error) {
        /* will send error only if anything in "create_payment_json" will "missing/wrong according 
         to schema" otherwise will send the response of else part to frontend*/
        return res.status(500).json({
          success: false,
          message: "Error while creating paypal payment",
        });
      } else {
        const approvalURL = paymentInfo.links.find(
          (link) => link.rel === "approval_url"
        ).href;

        const selfURL = paymentInfo.links.find(
          (link) => link.rel === "self"
        ).href;

        const paymentToken = new URL(approvalURL).searchParams.get("token");
        const payerToken = selfURL.split("payment/")[1];

        const newlyCreatedOrder = new Order({
          userId,
          cartId,
          cartItems,
          addressInfo,
          orderStatus,
          paymentMethod,
          paymentStatus,
          totalAmount,
          orderDate,
          orderUpdateDate,
          paymentId: paymentToken,
          payerId: payerToken,
        });

        await newlyCreatedOrder.save();

        /*Since no error so response will go, this response not guarentees that 
        your payment is done by the user, this approvalURL you have to provide to your client and 
        then your client will make the payment */
        res.status(201).json({
          success: true,
          paymentToken,
          approvalURL,
          orderId: newlyCreatedOrder._id,
        });
      }
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const capturePayment = async (req, res) => {
  try {
    const { paymentToken, orderId } = req.body;

    let order = await Order.findOneAndDelete({ paymentId: paymentToken });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order can not be found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order didn't placed due to Payment Cancellation!!!",
      data: order,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const paymentSuccess = async (req, res) => {
  try {
    const { paymentToken, PayerID } = req.body;

    let updatePaymentStatus = await Order.findOneAndUpdate(
      { paymentId: paymentToken },
      {
        $set: {
          paymentStatus: "paid",
          orderStatus: "confirmed",
          paymentId: paymentToken,
          payerId: PayerID,
        },
      },
      { new: true } // Return the updated document
    );
    if (!(updatePaymentStatus || updatePaymentStatus.paymentStatus)) {
      return res.status(404).json({
        success: false,
        message: "Order can not be found",
      });
    }
    for (let item of updatePaymentStatus.cartItems) {
      let product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Not enough stock for this product ${product.title}`,
        });
      }

      product.totalStock -= item.quantity;

      await product.save();
    }
    const getCartId = updatePaymentStatus.cartId;
    await Cart.findByIdAndDelete(getCartId);

    console.log("jiupdatePaymentStatus", updatePaymentStatus);
    const { email } = await User.findById(updatePaymentStatus.userId);
    console.log("koiu", email);

    sendMail({
      to: email,
      html: invoiceTemplate(updatePaymentStatus),
      subject: "Order Received",
    });

    res.status(200).json({
      success: true,
      message: "Payment Status Updated",
      userId: updatePaymentStatus.userId,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ userId });

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "No orders found!",
      });
    }

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

module.exports = {
  createOrder,
  capturePayment,
  getAllOrdersByUser,
  getOrderDetails,
  paymentSuccess,
};
