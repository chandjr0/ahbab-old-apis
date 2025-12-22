const mongoose = require("mongoose");
const PathaoCityModel = require("../src/models/courierServices/pathao/pathaoCity");
const PathaoZoneModel = require("../src/models/courierServices/pathao/pathaoZone");

// Common Bangladesh districts (cities) and their thanas (zones)
const bangladeshDistricts = [
  { city_id: 1, city_name: "Dhaka" },
  { city_id: 2, city_name: "Chittagong" },
  { city_id: 3, city_name: "Sylhet" },
  { city_id: 4, city_name: "Rajshahi" },
  { city_id: 5, city_name: "Khulna" },
  { city_id: 6, city_name: "Barisal" },
  { city_id: 7, city_name: "Rangpur" },
  { city_id: 8, city_name: "Mymensingh" },
  { city_id: 9, city_name: "Comilla" },
  { city_id: 10, city_name: "Narayanganj" },
  { city_id: 11, city_name: "Gazipur" },
  { city_id: 12, city_name: "Cox's Bazar" },
  { city_id: 13, city_name: "Jessore" },
  { city_id: 14, city_name: "Bogra" },
  { city_id: 15, city_name: "Dinajpur" },
];

const bangladeshThanas = [
  // Dhaka zones
  { zone_id: 101, zone_name: "Gulshan", city_id: 1 },
  { zone_id: 102, zone_name: "Dhanmondi", city_id: 1 },
  { zone_id: 103, zone_name: "Uttara", city_id: 1 },
  { zone_id: 104, zone_name: "Banani", city_id: 1 },
  { zone_id: 105, zone_name: "Mohakhali", city_id: 1 },
  { zone_id: 106, zone_name: "Mirpur", city_id: 1 },
  { zone_id: 107, zone_name: "Wari", city_id: 1 },
  { zone_id: 108, zone_name: "Motijheel", city_id: 1 },
  { zone_id: 109, zone_name: "Old Dhaka", city_id: 1 },
  { zone_id: 110, zone_name: "Tejgaon", city_id: 1 },
  
  // Chittagong zones
  { zone_id: 201, zone_name: "Agrabad", city_id: 2 },
  { zone_id: 202, zone_name: "Chawkbazar", city_id: 2 },
  { zone_id: 203, zone_name: "Pahartali", city_id: 2 },
  { zone_id: 204, zone_name: "Halishahar", city_id: 2 },
  { zone_id: 205, zone_name: "Nasirabad", city_id: 2 },
  
  // Sylhet zones
  { zone_id: 301, zone_name: "Sylhet Sadar", city_id: 3 },
  { zone_id: 302, zone_name: "Zindabazar", city_id: 3 },
  { zone_id: 303, zone_name: "Amberkhana", city_id: 3 },
  
  // Rajshahi zones
  { zone_id: 401, zone_name: "Rajshahi Sadar", city_id: 4 },
  { zone_id: 402, zone_name: "Kazla", city_id: 4 },
  
  // Khulna zones
  { zone_id: 501, zone_name: "Khulna Sadar", city_id: 5 },
  { zone_id: 502, zone_name: "Sonadanga", city_id: 5 },
  
  // Barisal zones
  { zone_id: 601, zone_name: "Barisal Sadar", city_id: 6 },
  { zone_id: 602, zone_name: "Nathullabad", city_id: 6 },
  
  // Rangpur zones
  { zone_id: 701, zone_name: "Rangpur Sadar", city_id: 7 },
  { zone_id: 702, zone_name: "Kotwali", city_id: 7 },
  
  // Mymensingh zones
  { zone_id: 801, zone_name: "Mymensingh Sadar", city_id: 8 },
  
  // Comilla zones
  { zone_id: 901, zone_name: "Comilla Sadar", city_id: 9 },
  { zone_id: 902, zone_name: "Kandirpar", city_id: 9 },
  
  // Narayanganj zones
  { zone_id: 1001, zone_name: "Narayanganj Sadar", city_id: 10 },
  { zone_id: 1002, zone_name: "Bandar", city_id: 10 },
  
  // Gazipur zones
  { zone_id: 1101, zone_name: "Gazipur Sadar", city_id: 11 },
  { zone_id: 1102, zone_name: "Kaliakair", city_id: 11 },
  
  // Cox's Bazar zones
  { zone_id: 1201, zone_name: "Cox's Bazar Sadar", city_id: 12 },
  { zone_id: 1202, zone_name: "Kolatoli", city_id: 12 },
  
  // Jessore zones
  { zone_id: 1301, zone_name: "Jessore Sadar", city_id: 13 },
  
  // Bogra zones
  { zone_id: 1401, zone_name: "Bogra Sadar", city_id: 14 },
  { zone_id: 1402, zone_name: "Shibganj", city_id: 14 },
  
  // Dinajpur zones
  { zone_id: 1501, zone_name: "Dinajpur Sadar", city_id: 15 },
];

async function populatePathaoData() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ahbab_local";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await PathaoCityModel.deleteMany({});
    // await PathaoZoneModel.deleteMany({});
    // console.log("Cleared existing Pathao data");

    // Insert cities
    const cityBulkOps = bangladeshDistricts.map((city) => ({
      updateOne: {
        filter: { city_id: city.city_id },
        update: { $set: city },
        upsert: true,
      },
    }));

    await PathaoCityModel.bulkWrite(cityBulkOps);
    console.log(`✓ Inserted/Updated ${bangladeshDistricts.length} districts (cities)`);

    // Insert zones
    const zoneBulkOps = bangladeshThanas.map((zone) => ({
      updateOne: {
        filter: { city_id: zone.city_id, zone_id: zone.zone_id },
        update: { $set: { ...zone, isActive: true } },
        upsert: true,
      },
    }));

    await PathaoZoneModel.bulkWrite(zoneBulkOps);
    console.log(`✓ Inserted/Updated ${bangladeshThanas.length} thanas (zones)`);

    // Verify data
    const cityCount = await PathaoCityModel.countDocuments();
    const zoneCount = await PathaoZoneModel.countDocuments();
    console.log(`\n✓ Total cities in database: ${cityCount}`);
    console.log(`✓ Total zones in database: ${zoneCount}`);

    console.log("\n✅ Pathao data populated successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error populating Pathao data:", error);
    process.exit(1);
  }
}

populatePathaoData();








