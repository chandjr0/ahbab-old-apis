const axios = require('axios');

const createSteadfastBulkOrder = async (steadfastPayload, courierServiceData) => {
    try {
        const result = await axios.post(
            "https://portal.steadfast.com.bd/api/v1/create_order/bulk-order",
            steadfastPayload,
            {
                headers: {
                    "Content-Type": "application/json",
                    "Api-Key": courierServiceData.steadfast.STEADFAST_API_KEY,
                    "Secret-Key": courierServiceData.steadfast.STEADFAST_SK,
                },
            }
        );
        if (!result?.data?.data?.length) throw new Error("Courier data is not correctly submitted!");
        return result.data.data;
    } catch (err) {
        console.error("createSteadfastBulkOrder error:", err);
        throw new Error("createSteadfastBulkOrder server error.");
    }
};

const creteSteadFastPayload = (orders) => orders.map(order => ({
    invoice: order.serialId,
    recipient_name: order.deliveryAddress?.name,
    recipient_phone: order.deliveryAddress?.phone,
    recipient_address: order.deliveryAddress?.address,
    cod_amount: order.customerCharge?.remainingTkPay,
    note: order?.customerNote || ''
}));

const buildTrackData = (order, item, courierId, user) => {
    return {
        orderId: order._id,
        courierId,
        employeeId: user.role === "employee" ? user._id : null,
        createdBy: user.role === "employee" ? user.name : "admin",
        trackId: item.tracking_code,
        steadfastKeys: {
            consignment_id: item.consignment_id,
            invoice: item.invoice,
            tracking_code: item.tracking_code,
            recipient_name: item.recipient_name,
            recipient_phone: item.recipient_phone,
            recipient_address: item.recipient_address,
            cod_amount: item.cod_amount,
            status: item.status,
            note: item.note,
        },
    };
};

module.exports = {
    createSteadfastBulkOrder,
    creteSteadFastPayload,
    buildTrackData
};