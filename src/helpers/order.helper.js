import moment from "moment";

export const extractAdvanceOrderLocationAndTime = (order) => {
  const foodTruck = order.foodTruck;
  const locationId = order.locationId;
  const availabilityId = order.availabilityId;

  let locationTitle = null;
  let advanceOrder = false;
  let advanceLocationTitle = null;
  let advanceTime = null;

  // Find the location title
  if (foodTruck && foodTruck.locations && locationId) {
    const foundLocation = foodTruck.locations.find(
      (loc) => loc._id === locationId
    );
    if (foundLocation) {
      locationTitle = foundLocation.title;
    }
  }

  // Determine advance order status and details if availabilityId exists
  if (availabilityId) {
    advanceOrder = true;

    if (foodTruck && foodTruck.availability) {
      const foundAvailability = foodTruck.availability.find(
        (avail) => avail._id === availabilityId
      );

      if (foundAvailability) {
        // Get advance location title
        if (foodTruck.locations) {
          const advLocation = foodTruck.locations.find(
            (loc) => loc._id === foundAvailability.locationId
          );
          if (advLocation) {
            advanceLocationTitle = advLocation.title;
          }
        }

        // Format advance time
        const dayMap = {
          mon: "Mon",
          tue: "Tue",
          wed: "Wed",
          thu: "Thu",
          fri: "Fri",
          sat: "Sat",
          sun: "Sun",
        };
        const day =
          dayMap[foundAvailability.day.toLowerCase()] || foundAvailability.day;

        const formattedStartTime = moment(
          foundAvailability.startTime,
          "HH:mm"
        ).format("hh:mm A");
        const formattedEndTime = moment(
          foundAvailability.endTime,
          "HH:mm"
        ).format("hh:mm A");

        advanceTime = `${day}, ${formattedStartTime}-${formattedEndTime}`;
      }
    }
  }

  return {
    locationTitle: locationTitle,
    advanceOrder: advanceOrder,
    advanceLocationTitle: advanceLocationTitle,
    advanceTime: advanceTime,
  };
};
