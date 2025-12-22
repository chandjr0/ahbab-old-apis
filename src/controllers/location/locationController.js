const DivisionModel = require("../../models/location/division");
const DistrictModel = require("../../models/location/district");
const AreaModel = require("../../models/location/area");

const getAllDivisions = async (req, res) => {
  try {
    const data = await DivisionModel.find(
      {},
      {
        _id: 1,
        name: 1,
      }
    ).sort({
      name: 1,
    });

    if (data) {
      return res.status(200).json({
        data,
        success: true,
        message: `all divisions`,
      });
    }
    return res.status(402).json({
      data: null,
      success: false,
      message: "Division not found!.",
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Serer Error Occurred.",
    });
  }
};

const getAllDistrict = async (req, res) => {
  try {
    const data = await DistrictModel.find(
      {},
      {
        _id: 1,
        name: 1,
        status: 1,
        divisionId: 1,
      }
    ).sort({
      name: 1,
    });

    if (data) {
      return res.status(200).json({
        data,
        success: true,
        message: `all districts`,
      });
    }
    return res.status(402).json({
      data: null,
      success: false,
      message: "District not found!.",
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Serer Error Occurred.",
    });
  }
};

const getAllAreas = async (req, res) => {
  try {
    const data = await AreaModel.find(
      {},
      {
        _id: 1,
        name: 1,
        status: 1,
        districtId: 1,
      }
    ).sort({
      name: 1,
    });

    if (data) {
      return res.status(200).json({
        data,
        success: true,
        message: `all areas`,
      });
    }
    return res.status(402).json({
      data: null,
      success: false,
      message: "Area not found!.",
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Serer Error Occurred.",
    });
  }
};

const getDistrictAreas = async (req, res) => {
  try {
    const data = await AreaModel.find(
      {
        districtId: req.params.districtId,
      },
      {
        _id: 1,
        name: 1,
        status: 1,
        districtId: 1,
      }
    ).sort({
      name: 1,
    });

    if (data) {
      return res.status(200).json({
        data,
        success: true,
        message: `all district areas`,
      });
    }
    return res.status(402).json({
      data: null,
      success: false,
      message: "District area not found!.",
    });
  } catch (err) {
    return res.status(500).json({
      data: null,
      success: false,
      message: "Internal Serer Error Occurred.",
    });
  }
};

const allLocations = async (req, res) => {
  try {
    const [divisions, districts, areas] = await Promise.all([
      await DivisionModel.find(
        {},
        {
          _id: 1,
          name: 1,
        }
      ).sort({
        name: 1,
      }),
      await DistrictModel.find(
        {},
        {
          _id: 1,
          name: 1,
          status: 1,
          divisionId: 1,
        }
      ).sort({
        name: 1,
      }),
      await AreaModel.find(
        {},
        {
          _id: 1,
          name: 1,
          status: 1,
          districtId: 1,
        }
      ).sort({
        name: 1,
      }),
    ]);

    const obj = {
      divisions,
      districts,
      areas,
    };

    if (obj) {
      res.status(200).json({
        data: obj,
        success: true,
      });
    } else {
      res.status(402).json({
        data: null,
        success: false,
        message: "Data not found!.",
      });
    }
  } catch (err) {
    res.status(500).json({
      data: null,
      success: false,
      message: "Internal Serer Error Occurred.",
    });
  }
};

const addArea = async (req, res) => {
  try {
    const districtData = await DistrictModel.findOne({ _id: req.body.districtId });

    if (!districtData) {
      res.status(400).json({
        data: null,
        success: false,
        message: "Couldn't found the district",
      });
    }

    const areaData = await AreaModel.create({
      districtId: req.body.districtId,
      name: req.body.name,
      status: districtData?.status,
    });

    res.status(200).json({
      data: areaData,
      success: true,
      message: "Add area successfully.",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      data: null,
      success: false,
      message: "Internal Serer Error Occurred.",
    });
  }
};

const removeArea = async (req, res) => {
  try {
    const areaData = await AreaModel.findOneAndDelete({ _id: req.params.areaId });

    if (!areaData) {
      res.status(400).json({
        data: null,
        success: false,
        message: "Couldn't delete the area",
      });
    }

    res.status(200).json({
      data: areaData,
      success: true,
      message: "Delete area successfully.",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      data: null,
      success: false,
      message: "Internal Serer Error Occurred.",
    });
  }
};

module.exports = {
  getAllDivisions,
  getAllDistrict,
  getAllAreas,
  getDistrictAreas,
  allLocations,

  addArea,
  removeArea,
};
