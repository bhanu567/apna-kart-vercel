import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { paymentSuccess } from "@/store/shop/order-slice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchCartItems } from "@/store/shop/cart-slice";

function PaymentSuccessPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    function updatePaymentStatus() {
      const paymentToken = new URL(location).searchParams.get("token");

      const PayerID = new URL(location).searchParams.get("PayerID");

      dispatch(paymentSuccess({ paymentToken, PayerID })).then((data) => {
        if (data?.payload?.success) {
          dispatch(fetchCartItems(data.payload.userId));
        }
      });
    }
    updatePaymentStatus();
  }, [dispatch]);

  return (
    <Card className="p-10">
      <CardHeader className="p-0">
        <CardTitle className="text-4xl">Payment is successfull!</CardTitle>
      </CardHeader>
      <Button className="mt-5" onClick={() => navigate("/shop/account")}>
        View Orders
      </Button>
    </Card>
  );
}

export default PaymentSuccessPage;
