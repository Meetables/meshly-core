//DONE

async function checkAvailability(userId) {
    try {
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
                const currentTime = Date.now();
                const currentWeekday = new Date(currentTime).getDay();
                //convert index to three letter weekday
                const weekdays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
                const currentWeekdayString = weekdays[currentWeekday];
                // Check if the json content includes the current time, for example "16:41" for today's weekday, every weekday has a json key and value is the timespan when available, so f.ex. "14:00-16:00". So check if the current time is between the start and end time of the json value
                if (jsonContent[currentWeekdayString]) {
                    const timespan = jsonContent[currentWeekdayString].split("-");
                    const startTime = new Date();
                    const endTime = new Date();
                    const [startHour, startMinute] = timespan[0].split(":");
                    const [endHour, endMinute] = timespan[1].split(":");
                    startTime.setHours(startHour, startMinute);
                    endTime.setHours(endHour, endMinute);
                    
                    if (currentTime >= startTime && currentTime <= endTime) {
                        return {
                            success: true,
                            message: "User is available"
                        }
                    } else {
                        return {
                            success: false,
                            message: "User is not available"
                        }
                    }   
                }
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

module.exports = {checkAvailability};