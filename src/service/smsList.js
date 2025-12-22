const registrationMsg = (otp) => {
  const message = `(AHABAB) প্রিয় গ্রাহক, আপনার রেজিস্ট্রেশন ওটিপি ${otp}`;
  return message;
};

const orderVerificationMsg = (otp) => {
  const message = `(AHABAB) প্রিয় গ্রাহক, আপনার অর্ডার ওটিপি ${otp}`;
  return message;
};

const customerLoginVerificationMsg = (otp) => {
  const message = `(AHABAB) প্রিয় গ্রাহক, আপনার লগইন ওটিপি ${otp}`;
  return message;
};

const resetMsg = (otp) => {
  const message = `(AHABAB) প্রিয় গ্রাহক, আপনার পাসওয়ার্ড পরিবর্তনের ওটিপি ${otp}`;
  return message;
};

const pendingOrderMsg = (serialId) => {
  const message = `(AHABAB) প্রিয় গ্রাহক, আপনার অর্ডারটি সফল হয়েছে। অর্ডার আইডি ${serialId}`;
  return message;
};

const orderConfirmationMsg = (serialId) => {
  const message = `(AHABAB) প্রিয় গ্রাহক, আপনার অর্ডার & বিকাশ পেমেন্ট সফল হয়েছে। অর্ডার আইডি ${serialId}`;
  return message;
};

// const confirmOrderMsg = (serialId, dueTk) => {
//   const message = `হ্যালো,আপনার অর্ডার নাম্বার :${serialId},কনফার্ম করা হয়েছে এবং খুব শীঘ্রই কুরিয়ারে দেওয়া হবে। ডিউ এমাউন্ট:${dueTk} টাকা। www.${process.env.ADMIN_BASE_URL}`;
//   return message;
// };

// const holdOrderMsg = (serialId) => {
//   const message = `হ্যালো ,আপনার অর্ডার নাম্বার:${serialId},ডেলিভারী চার্জ অগ্রিমের জন্যে হোল্ড করা হয়েছে। www.${process.env.ADMIN_BASE_URL}`;

//   return message;
// };

// const cancelOrderMsg = (serialId) => {
//   const message = `হ্যালো,দুঃখিত আপনার অর্ডার নাম্বার :${serialId}, বিশেষ কারনে ক্যান্সেল করা হয়েছে । www.${process.env.ADMIN_BASE_URL}`;
//   return message;
// };

const affiliateMsg = {
  registration: `Assalamu Alaikum , your affiliate application status is being processed. You will get notified soon.`,
  regApprove: `Congrats! Your affiliate application has been approved. Now you can log in to your account. Login here - partner.ahbab.com`,
};

module.exports = {
  registrationMsg,
  customerLoginVerificationMsg,
  orderVerificationMsg,
  resetMsg,
  pendingOrderMsg,
  orderConfirmationMsg,
  // confirmOrderMsg,
  // holdOrderMsg,
  // cancelOrderMsg,
  affiliateMsg,
};
