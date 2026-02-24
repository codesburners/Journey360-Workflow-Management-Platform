export const safetyData = {
    location: "Paris, France",
    riskLevel: {
        status: "Moderate Risk",
        score: 45,
        maxScore: 100,
        description: "Stable conditions, but exercise normal caution in crowded tourist areas.",
        trend: "stable" // or 'increasing', 'decreasing'
    },
    emergency: {
        number: "112",
        label: "Universal EU Emergency",
    },
    activeAlerts: {
        total: 4,
        recent: 2,
        description: "Check details below for location-specific warnings."
    },
    alerts: [
        {
            id: 1,
            type: "critical", // 'critical', 'warning', 'info', 'transit'
            title: "Pickpocketing Alert: Louvre District",
            description: "High activity of organized groups reported near the pyramid entrance and Metro Palais-Royal. Keep valuables secured.",
            time: "14:22 PM",
            distance: "1.2km from you",
            coordinates: { lat: 48.8606, lng: 2.3376 }
        },
        {
            id: 2,
            type: "info",
            title: "Planned Protest: Place de la République",
            description: "Demonstration scheduled for 18:00. Expect heavy police presence and transit diversions in the area.",
            time: "13:05 PM",
            distance: "4.8km from you",
            coordinates: { lat: 48.8675, lng: 2.3638 }
        },
        {
            id: 3,
            type: "transit",
            title: "RER A: Minor Delay",
            description: "Maintenance works between Charles de Gaulle–Étoile and Auber. Delays of 10–15 minutes expected.",
            time: "11:45 AM",
            // No distance for general transit sometimes
        }
    ],
    aiInsight: {
        title: "Journey360 AI Insight",
        text: "Based on your itinerary to Montmartre this evening, we recommend using a rideshare service after 22:00. Recent data shows a 15% uptick in petty theft near the Anvers station after dark. I've highlighted the safest walking route in your planner."
    }
};

export const navigationContext = {
    user: {
        name: "Alex",
        avatar: "https://i.pravatar.cc/150?u=alex"
    },
    notifications: 3
};
