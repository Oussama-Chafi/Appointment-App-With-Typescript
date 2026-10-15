import cron from "node-cron";
import User from "../models/userSchema.js";
import DocSlot from "../models/slotSchema.js";

export const initCronJobs = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("corn jobs");
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const deleteUnverifiedAccounts = await User.deleteMany({
        isVerified: false,
        verificationTokenExpiry: { $lte: twentyFourHoursAgo, $ne: null },
      });
    
      const today = new Date().toISOString().split("T")[0]!;
      await DocSlot.deleteMany({
        isBooked: false,
        date: { $lt: today },
      });
    } catch (error) {
      console.log("Error in cron job", error);
    }
  });
};
