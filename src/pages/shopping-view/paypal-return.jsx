import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { capturePayment } from "@/store/shop/order-slice";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "@/components/ui/use-toast";

function PaypalReturnPage() {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const paymentID = useSelector((state) => state.shopOrder.paymentToken);
  const orderID = useSelector((state) => state.shopOrder.orderId);

  useEffect(() => {
    function verifyPayment() {
      const paymentToken =
        new URL(location).searchParams.get("token") || paymentID;

      const orderId =
        JSON.parse(sessionStorage.getItem("currentOrderId")) || orderID;

      dispatch(capturePayment({ paymentToken, orderId })).then((data) => {
        if (data?.payload?.success) {
          window.location.href = "/shop/checkout";
        } else {
          toast({
            title: data.payload.message,
            variant: "destructive",
          });
        }
      });
    }
    verifyPayment();
  }, [dispatch]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Processing Payment...Please wait!</CardTitle>
      </CardHeader>
    </Card>
  );
}

export default PaypalReturnPage;
