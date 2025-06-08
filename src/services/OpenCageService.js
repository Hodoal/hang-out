class OpenCageService {
  static async getPlaces(query, params = {}) {
    const apiKey = "YOUR_OPENCAGE_API_KEY"; // Replace with your OpenCage API key
    const baseUrl = "https://api.opencagedata.com/geocode/v1/json";

    const queryParams = new URLSearchParams({
      key: apiKey,
      q: query,
      ...params,
    });

    try {
      const response = await fetch(`${baseUrl}?${queryParams}`);
      if (!response.ok) {
        throw new Error(`OpenCage API request failed with status ${response.status}`);
      }
      const data = await response.json();

      return data.results.map((result) => {
        // Basic mood mapping (will be expanded)
        const moods = OpenCageService.determineMoodsFromPlaceType(result.components._type || result.components._category);

        return {
          id: result.annotations.geohash || `${result.geometry.lat}-${result.geometry.lng}`, // OpenCage doesn't provide a stable ID
          name: result.components.road || result.components.neighbourhood || result.formatted,
          category: result.components._category || result.components._type || "unknown",
          rating: 0, // OpenCage doesn't provide ratings
          ratingCount: 0,
          description: result.formatted,
          address: result.formatted,
          imageUrl: "https://via.placeholder.com/300", // Placeholder image
          matchingMoods: moods,
          latitude: result.geometry.lat,
          longitude: result.geometry.lng,
        };
      });
    } catch (error) {
      console.error("Error fetching places from OpenCage:", error);
      throw error;
    }
  }

  static determineMoodsFromPlaceType(placeType) {
    const moods = [];
    if (!placeType) return moods;

    const type = placeType.toLowerCase();

    if (type.includes("restaurant")) {
      moods.push("hungry", "social");
    }
    if (type.includes("cafe")) {
      moods.push("relaxed", "creative");
    }
    if (type.includes("park")) {
      moods.push("relaxed", "happy");
    }
    if (type.includes("bar") || type.includes("pub")) {
      moods.push("social");
    }
    if (type.includes("museum") || type.includes("art_gallery")) {
      moods.push("creative");
    }
    // Add more mappings as needed
    return moods;
  }
}

export default OpenCageService;
