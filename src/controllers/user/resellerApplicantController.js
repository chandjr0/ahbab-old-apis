// const ResellerApplicantModel = require("../../models/user/resellerApplicant");
// const customMetaData = require("../../helpers/customMetaData");

// const { validateEmail } = require("../../helpers/shareFunc");

// // submit form as a visitor
// const submitResellerApplication = async (req, res) => {
//   try {
//     if (req.body.email !== "") {
//       const checkEmailFormat = validateEmail(req.body.email);
//       if (!checkEmailFormat) {
//         return res.status(406).json({
//           data: null,
//           success: false,
//           message: "Wrong email format!",
//         });
//       }
//     }

//     const exitApplicant = await ResellerApplicantModel.findOne({
//       $and: [
//         {
//           phone: req.body.phone,
//         },
//         {
//           status: "pending",
//         },
//       ],
//     });

//     if (exitApplicant) {
//       return res.status(409).json({
//         data: null,
//         success: false,
//         message: `Already submit a form with this phone number ${req.body.phone}`,
//       });
//     }

//     const submitData = await ResellerApplicantModel.create(req.body);

//     if (!submitData) {
//       return res.status(400).json({
//         data: null,
//         success: false,
//         message: "Failed to submit form!",
//       });
//     }

//     return res.status(201).json({
//       data: submitData,
//       success: true,
//       message: "Submit form successfully.",
//     });
//   } catch (err) {
//     console.log("*** resellerApplicantController: submitResellerApplication ***");
//     console.log("ERROR:", err);
//     return res.status(500).json({
//       data: null,
//       success: false,
//       message: "Internal Server Error Occurred.",
//     });
//   }
// };

// const listOfApplication = async (req, res) => {
//   try {
//     const page = Math.max(1, req.query.page) || 1;
//     const pageLimit = Math.max(1, req.query.limit) || 1;

//     let matchCondition = {};

//     if (req.body.status !== "all") {
//       matchCondition = {
//         status: req.body.status,
//       };
//     }

//     const [applicantList, totalData] = await Promise.all([
//       ResellerApplicantModel.find(matchCondition)
//         .sort({ createdAt: -1 })
//         .limit(pageLimit)
//         .skip((page - 1) * pageLimit),
//       ResellerApplicantModel.countDocuments(matchCondition),
//     ]);

//     if (!applicantList) {
//       return res.status(400).json({
//         data: null,
//         success: false,
//         message: "Failed to submit form!",
//       });
//     }

//     return res.status(201).json({
//       metaData: customMetaData(page, pageLimit, totalData),
//       data: applicantList,
//       success: true,
//       message: "Submit form successfully.",
//     });
//   } catch (err) {
//     console.log("*** resellerApplicantController: listOfApplication ***");
//     console.log("ERROR:", err);
//     return res.status(500).json({
//       data: null,
//       success: false,
//       message: "Internal Server Error Occurred.",
//     });
//   }
// };

// const viewApplicant = async (req, res) => {
//   try {
//     const applicantData = await ResellerApplicantModel.findOne({ _id: req.params.applicantId });

//     if (!applicantData) {
//       return res.status(400).json({
//         data: null,
//         success: false,
//         message: "Failed to view!",
//       });
//     }

//     return res.status(201).json({
//       data: applicantData,
//       success: true,
//       message: "View successfully.",
//     });
//   } catch (err) {
//     console.log("*** resellerApplicantController: viewApplicant ***");
//     console.log("ERROR:", err);
//     return res.status(500).json({
//       data: null,
//       success: false,
//       message: "Internal Server Error Occurred.",
//     });
//   }
// };

// const updateApplicantStatus = async (req, res) => {
//   try {
//     const applicantList = await ResellerApplicantModel.findOneAndUpdate(
//       { _id: req.params.applicantId },
//       {
//         $set: {
//           status: req.body.status,
//         },
//       },
//       {
//         new: true,
//       }
//     );

//     if (!applicantList) {
//       return res.status(400).json({
//         data: null,
//         success: false,
//         message: "Failed to submit form!",
//       });
//     }

//     return res.status(201).json({
//       data: applicantList,
//       success: true,
//       message: "Submit form successfully.",
//     });
//   } catch (err) {
//     console.log("*** resellerApplicantController: updateApplicantStatus ***");
//     console.log("ERROR:", err);
//     return res.status(500).json({
//       data: null,
//       success: false,
//       message: "Internal Server Error Occurred.",
//     });
//   }
// };

// module.exports = {
//   // visitor
//   submitResellerApplication,

//   // admin
//   listOfApplication,
//   viewApplicant,
//   updateApplicantStatus,
// };
