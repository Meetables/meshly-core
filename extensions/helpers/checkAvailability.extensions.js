const User = require("../../models/user.models");

//DONE
async function checkAvailability(userId) {
    try {
        console.log("Checking availability for user: " + userId);
        const user = await User.findById(userId);
        if (!user) {
            return {
                success: false,
                error: "User not found"
            }
        }
        const stories = user.stories;

        if (stories.length > 0) {
            const latestStory = stories[stories.length - 1];

            if (latestStory.contentType == "encodedJSON") {
                const jsonContent = JSON.parse(latestStory.content);
                let currentTime = Date.now();
                const currentWeekday = new Date(currentTime).getDay();
                //convert index to three letter weekday
                const weekdays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
                const currentWeekdayString = weekdays[currentWeekday];
                console.log("Current weekday: " + currentWeekdayString);

                if (jsonContent[currentWeekdayString]) {
                    const timespan = jsonContent[currentWeekdayString].split("-");
                    const [startHour, startMinute] = timespan[0].split(":").map(Number);
                    const [endHour, endMinute] = timespan[1].split(":").map(Number);

                    const startTime = new Date();
                    const endTime = new Date();
                    currentTime = new Date(currentTime);
                    currentTime.setHours(new Date().getHours(), new Date().getMinutes(), 0, 0);
                    startTime.setHours(startHour, startMinute, 0, 0);
                    endTime.setHours(endHour, endMinute, 0, 0);

                    if (currentTime >= startTime.getTime() && currentTime <= endTime.getTime()) {
                        return { success: true, message: "User is available" };
                    } else {
                        return { success: false, message: "User is not available" };
                    }
                }

            } else {
                console.error("Latest story is not of type 'encodedJSON'");
            }
        } else {
            return {
                success: false,
                error: "No stories found"
            }
        }
    } catch (error) {
        return {
            success: false,
            error: error
        }
    }
}

module.exports = { checkAvailability };