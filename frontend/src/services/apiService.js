import { toast } from 'sonner';

const BASE_URL = `${import.meta.env.VITE_BACKEND_URL ?? ""}/api/v1`;

const getHeaders = async (auth) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    const token = await user.getIdToken();
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
};

/**
 * Centralized API request wrapper with error handling & toast notifications.
 */
const apiRequest = async (url, options = {}, context = "Request") => {
    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            let errorMessage = `${context} failed`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorMessage;
            } catch {
                errorMessage = `${context} failed (${response.status})`;
            }

            // User-friendly messages based on status
            switch (response.status) {
                case 401:
                    toast.error("Session expired. Please log in again.");
                    break;
                case 403:
                    toast.error("You don't have permission for this action.");
                    break;
                case 404:
                    toast.error("The requested resource was not found.");
                    break;
                case 429:
                    toast.warning("Too many requests. Please wait a moment and try again.");
                    break;
                case 503:
                    toast.warning("AI is at capacity. Please try again in 30 seconds.");
                    break;
                default:
                    toast.error(errorMessage);
            }
            throw new Error(errorMessage);
        }

        return response.json();
    } catch (error) {
        if (error.name === 'AbortError') {
            toast.error("Request timed out. Please try again.");
            throw error;
        }
        if (!navigator.onLine) {
            toast.error("You're offline. Check your internet connection.");
            throw error;
        }
        if (error.message === 'Failed to fetch') {
            toast.error("Unable to connect to server. Please try again later.");
            throw error;
        }
        // Re-throw if already handled above (has a user-friendly message)
        if (error.message && !error.message.startsWith('Failed to fetch')) {
            throw error;
        }
        toast.error("Something went wrong. Please try again.");
        throw error;
    }
};

export const apiService = {
    // Trip Endpoints
    createTrip: async (auth, tripData) => {
        const headers = await getHeaders(auth);
        return apiRequest(`${BASE_URL}/trip/create`, {
            method: "POST", headers, body: JSON.stringify(tripData)
        }, "Trip creation");
    },

    listTrips: async (auth) => {
        const headers = await getHeaders(auth);
        return apiRequest(`${BASE_URL}/trips`, { headers }, "Fetching trips");
    },

    // AI Itinerary Endpoints
    generateItinerary: async (auth, tripId) => {
        const headers = await getHeaders(auth);
        return apiRequest(`${BASE_URL}/ai/itinerary/generate?trip_id=${tripId}`, {
            method: "POST", headers
        }, "Itinerary generation");
    },

    getItinerary: async (auth, tripId) => {
        const headers = await getHeaders(auth);
        return apiRequest(`${BASE_URL}/trip/${tripId}/itinerary`, { headers }, "Fetching itinerary");
    },

    regenerateItinerary: async (auth, tripId, instruction, constraints = {}) => {
        const headers = await getHeaders(auth);
        return apiRequest(`${BASE_URL}/ai/itinerary/regenerate`, {
            method: "POST", headers,
            body: JSON.stringify({ tripId, instruction, constraints })
        }, "Itinerary regeneration");
    },

    chat: async (auth, message, tripId = null) => {
        const headers = await getHeaders(auth);
        let url = `${BASE_URL}/ai/chat?message=${encodeURIComponent(message)}`;
        if (tripId) url += `&trip_id=${tripId}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        try {
            const result = await apiRequest(url, {
                method: "POST", headers, signal: controller.signal
            }, "AI chat");
            clearTimeout(timeoutId);
            return result;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    },

    assessSafety: async (auth, location) => {
        const headers = await getHeaders(auth);
        return apiRequest(`${BASE_URL}/ai/safety/assess?location=${encodeURIComponent(location)}`, {
            method: "POST", headers
        }, "Safety assessment");
    },

    getDashboardContext: async (auth) => {
        const headers = await getHeaders(auth);
        return apiRequest(`${BASE_URL}/ai/dashboard/context`, { headers }, "Dashboard context");
    },

    // User Profile
    getProfile: async (auth) => {
        const headers = await getHeaders(auth);
        return apiRequest(`${BASE_URL}/users/me`, { headers }, "Profile fetch");
    },

    updateProfile: async (auth, data) => {
        const headers = await getHeaders(auth);
        return apiRequest(`${BASE_URL}/users/me`, {
            method: 'PUT', headers, body: JSON.stringify(data)
        }, "Profile update");
    },

    sendTestNotification: async (auth) => {
        const headers = await getHeaders(auth);
        return apiRequest(`${BASE_URL}/users/test-notify`, {
            method: 'POST', headers
        }, "Test notification");
    },

    deleteAccount: async (auth) => {
        const headers = await getHeaders(auth);
        return apiRequest(`${BASE_URL}/users/me`, {
            method: 'DELETE', headers
        }, "Account deletion");
    },

    // 2FA Endpoints
    setup2FA: async (auth) => {
        const headers = await getHeaders(auth);
        return apiRequest(`${BASE_URL}/users/2fa/setup`, {
            method: 'POST', headers
        }, "2FA setup");
    },

    verify2FA: async (auth, code) => {
        const headers = await getHeaders(auth);
        return apiRequest(`${BASE_URL}/users/2fa/verify`, {
            method: 'POST', headers, body: JSON.stringify({ code })
        }, "2FA verification");
    },

    disable2FA: async (auth) => {
        const headers = await getHeaders(auth);
        return apiRequest(`${BASE_URL}/users/2fa/disable`, {
            method: 'POST', headers
        }, "2FA disable");
    },

    // Saved Places Endpoints
    getSavedPlaces: async (auth) => {
        const headers = await getHeaders(auth);
        return apiRequest(`${BASE_URL}/saved-places`, { headers }, "Fetching saved places");
    },

    savePlace: async (auth, placeData) => {
        const headers = await getHeaders(auth);
        return apiRequest(`${BASE_URL}/saved-places`, {
            method: "POST", headers, body: JSON.stringify(placeData)
        }, "Saving place");
    },

    removeSavedPlace: async (auth, placeId) => {
        const headers = await getHeaders(auth);
        return apiRequest(`${BASE_URL}/saved-places/${placeId}`, {
            method: "DELETE", headers
        }, "Removing place");
    },

    checkIsSaved: async (auth, placeId) => {
        const headers = await getHeaders(auth);
        return apiRequest(`${BASE_URL}/saved-places/check/${placeId}`, { headers }, "Checking saved");
    },

    // Place Reviews (SerpAPI + Foursquare)
    getPlaceReviews: async (auth, placeName, destination) => {
        try {
            const headers = await getHeaders(auth);
            return await apiRequest(
                `${BASE_URL}/ai/place-reviews?place_name=${encodeURIComponent(placeName)}&destination=${encodeURIComponent(destination)}`,
                { headers }, "Fetching reviews"
            );
        } catch {
            return null;
        }
    }
};
