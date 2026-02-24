export const itineraryData = {
    title: "7-Day Paris Exploration",
    subtitle: "AI Generated Optimized Route • High Safety Rating",
    costs: {
        travel: 450,
        food: 320,
        stay: 850
    },
    days: [
        { id: 1, label: "Day 1" },
        { id: 2, label: "Day 2" },
        { id: 3, label: "Day 3" },
    ],
    currentDay: {
        date: "Monday, Oct 14",
        title: "DAY 1: HISTORIC HEART",
        events: [
            {
                id: 1,
                time: "09:00 AM",
                title: "Breakfast at Cafe de Flore",
                description: "A historic coffeehouse in Saint-Germain-des-Prés, famous for its intellectual clientele.",
                category: "Food",
                price: "Moderate",
                badges: [{ text: "SAFE AREA", type: "success" }],
                location: { lat: 48.854, lng: 2.333 }
            },
            {
                id: 2,
                time: "11:30 AM",
                title: "Louvre Museum Tour",
                description: "The world's largest art museum and a historic monument in Paris. Skip-the-line ticket recommended.",
                category: "Sightseeing",
                duration: "3 Hours",
                badges: [{ text: "CROWDED", type: "warning" }],
                location: { lat: 48.860, lng: 2.337 }
            },
            {
                id: 3,
                time: "02:00 PM",
                title: "Lunch at Le Meurice",
                description: "Exquisite French cuisine in a 2-Michelin-star setting overlooking the Tuileries Garden.",
                badges: [{ text: "HIGH RATING", type: "blue" }],
                rating: "Premium",
                location: { lat: 48.865, lng: 2.329 }
            },
            {
                id: 4,
                time: "04:30 PM",
                title: "Seine River Cruise",
                description: "A relaxing boat tour passing by Notre-Dame, the Eiffel Tower, and Pont Neuf.",
                badges: [{ text: "SCENIC", type: "success" }],
                location: { lat: 48.858, lng: 2.294 }
            }
        ]
    }
};
