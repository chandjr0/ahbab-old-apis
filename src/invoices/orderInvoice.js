const fs = require("fs");
// const PDFDocument = require("pdfkit");
const PDFDocument = require("pdfkit");

const blankImg =
  "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80";

// Start
function generateHeader(doc, invoice) {
  const date = new Date().toLocaleString();
  const onlyTime = date.split(",");

  const date2 = new Date().toString().split(" ");
  const OnlyDate = `${date2[1]} ${date2[2]} ${date2[3]}`;
  const logoImgUrl = invoice?.settingsData?.logoImg || blankImg;

  doc
    .fontSize(6)
    .font("Helvetica")
    .text(`${OnlyDate}`, 50, 28)

    // .image("/settings/0ziIrixJiMdu5q3_FtZ.jpg", 50, 48, { width: 80, height: 25 })
    .image(logoImgUrl, 50, 48, { width: 80, height: 25 })
    .fillColor("#444444")

    .fontSize(7)
    .font("Helvetica")
    .text("customer copy", 275, 25)

    .fontSize(6)
    .font("Helvetica")
    .text(`${onlyTime[1]}`, 425, 28)

    .fontSize(12)
    .font("Helvetica-Bold")
    .text("INVOICE", 425, 48);
}

function generateHr(doc, y) {
  doc.strokeColor("#191919").lineWidth(0.1).moveTo(50, y).lineTo(550, y).stroke();
}

function generateCustomerInformation(doc, invoice) {
  const customerInformationTop = 200;
  const date = invoice.createdAt.toString().split(" ");
  const finalDate = `${date[1]} ${date[2]} ${date[3]}`;
  const orderStatusName = invoice?.orderStatus[invoice.orderStatus.length - 1]?.status || "pending";
  const orderStatus = orderStatusName.toLowerCase();

  generateHr(doc, 127);

  doc
    .fontSize(9) // left start
    .font("Helvetica")
    .text(
      `house#${invoice?.settingsData?.address?.house}, road#${invoice?.settingsData?.address?.road}`,
      50,
      79,
      customerInformationTop
    )

    .font("Helvetica")
    .text(
      `${invoice?.settingsData?.address?.union}, ${invoice?.settingsData?.address?.district}-${invoice?.settingsData?.address?.zipCode}`,
      50,
      90,
      customerInformationTop + 15
    )

    .font("Helvetica")
    .text(`Phone: ${invoice?.settingsData?.phone}`, 50, 101, customerInformationTop)

    .font("Helvetica")
    .text(`Email: ${invoice?.settingsData?.email}`, 50, 111, customerInformationTop)
    // left end

    .fontSize(8) // right start
    .font("Helvetica-Bold")
    .text("Order Number:", 400, 65, customerInformationTop)
    .font("Helvetica")
    .text(invoice?.serialId, 459, 65, customerInformationTop + 15)

    .fontSize(8)
    .font("Helvetica-Bold")
    .text("Payment Type:", 400, 76, customerInformationTop)
    .font("Helvetica")
    .text(invoice?.payment?.paymentType, 464, 76, customerInformationTop + 15)

    .font("Helvetica-Bold")
    .text("Order Status:", 400, 87, customerInformationTop)
    .font("Helvetica")
    .text(
      orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1),
      453,
      87,
      customerInformationTop + 15
    )

    .font("Helvetica-Bold")
    .text("Order Date:", 400, 98, customerInformationTop)
    .font("Helvetica")
    .text(finalDate, 446, 99, customerInformationTop + 15)

    .fontSize(8)
    .font("Helvetica-Bold")
    .text("Shop Name:", 400, 109, customerInformationTop)
    .font("Helvetica")
    .text(invoice?.settingsData?.shopName, 448, 109, customerInformationTop + 15)
    // right end

    .font("Helvetica-Bold")
    .text("Shipping To:", 50, 135, customerInformationTop)

    .font("Helvetica")
    .text(invoice?.deliveryAddress?.name, 50, 150, customerInformationTop)

    .font("Helvetica-Bold")
    .text(invoice?.deliveryAddress?.phone, 50, 161, customerInformationTop)

    .fontSize(7)
    .font("Helvetica")
    .text(
      `${invoice?.deliveryAddress?.address?.division}, ${invoice?.deliveryAddress?.address?.district}, ${invoice?.deliveryAddress?.address?.upazila}`,
      50,
      172,
      customerInformationTop
    )

    .fontSize(7)
    .font("Helvetica")
    .text(invoice?.deliveryAddress?.address?.details, 50, 180, customerInformationTop);
}

function productImgFun(doc, wid, path) {
  doc.image(`${path}`, 70, wid - 4, { width: 15, height: 15 });
}

function generateTableRow(doc, y, position, image, itemName, rate, quantity, totalAmount) {
  doc
    .fontSize(9)
    .text(position, 50, y)
    .text(image, 70, y)
    .text(itemName, 110, y)
    .text(rate, 400, y, { width: 90, align: "left" })
    .text(quantity, 450, y, { width: 40, align: "left" })
    .text(totalAmount, 0, y, { align: "right" });
}

function generateTableFinalRow(doc, y, position, image, itemName, rate, quantity, totalAmount) {
  doc
    .fontSize(9)
    .text(position, 50, y)
    .text(image, 70, y)
    .text(itemName, 110, y)
    .text(rate, 350, y, { width: 90, align: "left" })
    .text(quantity, 410, y, { width: 90, align: "left" })
    .text(totalAmount, 0, y, { align: "right" });
}

function formatCurrency(cents) {
  return `${cents} Tk`;
}

function generateInvoiceTable(doc, invoice) {
  let i = 0;
  const invoiceTableTop = 215;

  doc.font("Helvetica-Bold");
  generateTableRow(
    doc,
    invoiceTableTop,
    "#",
    "Image",
    "Product Description",
    "Price",
    "Quantity",
    "Sub total"
  );
  generateHr(doc, invoiceTableTop + 12);
  doc.font("Helvetica");

  invoice.products.forEach((item) => {
    const position = invoiceTableTop + (i + 1) * 20;
    const itemName = `${item?.name.length < 40 ? item.name : `${item?.name.slice(0, 40)}..`}${
      item?.isVariant ? ` (${item?.variationName})` : ""
    }`;

    generateTableRow(
      doc,
      position,
      `${i + 1}.`,
      item?.galleryImage[0] ? productImgFun(doc, position, item?.galleryImage[0]) : blankImg,
      itemName,
      formatCurrency(item.price),
      Number(item?.quantity),
      formatCurrency(`${Number(item?.price) * Number(item?.quantity)}.00`)
    );
    generateHr(doc, position + 14);
    i++;
  });

  const deliveryPosition = invoiceTableTop + (i + 1) * 21;

  // const totalPosition10 = deliveryPosition + 15;
  // generateTableRow(
  //   doc.image(`${invoice.qrcode}`, 60, totalPosition10, { width: 50 }).fillColor("#444444"),
  //   "",
  //   "",
  //   "",
  //   "",
  //   ""
  // );

  doc.font("Helvetica");

  const totalPosition = deliveryPosition + 0;
  doc.font("Helvetica");
  generateTableFinalRow(
    doc,
    totalPosition,
    "",
    "",
    "",
    "",
    "Products Price: ",
    formatCurrency(`${invoice.customerCharge.totalProductPrice}.00`)
  );

  const totalPosition2 = deliveryPosition + 12;
  doc.font("Helvetica");
  generateTableFinalRow(
    doc,
    totalPosition2,
    "",
    "",
    "",
    "",
    "Delivery Charge: ",
    formatCurrency(`${invoice.customerCharge.deliveryCharge}.00`)
  );

  const totalPosition5 = deliveryPosition + 24;
  doc.font("Helvetica-Bold");
  generateTableFinalRow(
    doc,
    totalPosition5,
    "",
    "",
    "",
    "",
    "Total Bill: ",
    formatCurrency(`${invoice?.customerCharge?.TotalBill}.00`)
  );

  const totalPosition3 = deliveryPosition + 36;
  doc.font("Helvetica-Bold");
  generateTableFinalRow(
    doc,
    totalPosition3,
    "",
    "",
    "",
    "",
    "Paid: ",
    formatCurrency(`${invoice.customerCharge.totalPayTk}.00`)
  );

  const totalPosition4 = deliveryPosition + 48;
  doc.font("Helvetica-Bold");
  generateTableFinalRow(
    doc,
    totalPosition4,
    "",
    "",
    "",
    "",
    "Due: ",
    formatCurrency(`${invoice.customerCharge.remainingTkPay}.00`)
  );
}

function generateNewPage(doc) {
  doc.addPage();
}

function generateFooter(doc) {
  doc
    .font("Helvetica")
    .fontSize(6)
    .text("https://b2gsoft.com", 50, 780, { align: "center", width: 500 });
}

//* ******  single invoice  *******
function createInvoiceSingle(invoice, path) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  generateHeader(doc, invoice);
  generateCustomerInformation(doc, invoice);
  // productsTable(doc, invoice);
  generateInvoiceTable(doc, invoice);
  generateFooter(doc);
  doc.end();
  doc.pipe(fs.createWriteStream(path));
}

//* ****** multiple invoice *******
function createInvoiceMultiple(invoice, path) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  invoice.forEach((p, L) => {
    generateHeader(doc);
    generateCustomerInformation(doc, p);
    generateInvoiceTable(doc, p);
    generateFooter(doc);
    L < invoice.length - 1 && generateNewPage(doc);
  });
  doc.end();
  doc.pipe(fs.createWriteStream(path));
}

module.exports = {
  createInvoiceSingle,
  createInvoiceMultiple,
};
